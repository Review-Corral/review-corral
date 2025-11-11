import * as z from "zod";

import { Logger } from "@domain/logging";
import { getOrganization } from "@domain/postgres/fetchers/organizations";
import { safeFetchRepository } from "@domain/postgres/fetchers/repositories";
import {
  getSlackInstallationsForOrganization,
  updateLastChecked,
} from "@domain/postgres/fetchers/slack-integrations";
import { SlackClient } from "@domain/slack/SlackClient";
import { shouldWarnAboutScopes } from "@domain/slack/checkScopesOutdated";
import { sendScopeWarning } from "@domain/slack/sendScopeWarning";
import { handleIssueCommentEvent } from "./handlers/issueComment";
import { handlePullRequestEvent } from "./handlers/pullRequest";
import { handlePullRequestCommentEvent } from "./handlers/pullRequestComment";
import { handlePullRequestReviewEvent } from "./handlers/pullRequestReview";
import { GithubWebhookEventHander, handledEventNames } from "./types";

const LOGGER = new Logger("core.github.events");

// Purposefully leaving this out of the githubWebhookEventSchema so that we
// can parse them seperately
export const githubWebhookBodySchema = z
  .object({
    action: z.string(),
    repository: z
      .object({
        id: z.number(),
        owner: z
          .object({
            id: z.number(),
          })
          .passthrough(),
      })
      .passthrough(),
  })
  .passthrough();

export type GithubWebhookBody = z.infer<typeof githubWebhookBodySchema>;

const eventHandlers: Record<
  handledEventNames,
  {
    handler: GithubWebhookEventHander<any>;
  }
> = {
  pull_request: { handler: handlePullRequestEvent },
  pull_request_review_comment: { handler: handlePullRequestCommentEvent },
  pull_request_review: { handler: handlePullRequestReviewEvent },
  issue_comment: { handler: handleIssueCommentEvent },
};

export const handleGithubWebhookEvent = async ({
  event,
  eventName,
}: {
  event: GithubWebhookBody;
  eventName: string;
}) => {
  LOGGER.debug("Handling event body", { event, eventName });
  if (eventName in eventHandlers) {
    event.repository.owner.id;

    const repository = await safeFetchRepository({
      orgId: event.repository.owner.id,
      repoId: event.repository.id,
    });

    if (!repository) {
      LOGGER.info("Recieved event for repository not in the database", {
        repositoryId: event.repository.id,
        organizationId: event.repository.owner.id,
      });
      return;
    }

    if (!repository.isEnabled) {
      LOGGER.info("Recieved event for inactive repository", {
        repositoryId: event.repository.id,
        organizationId: repository.orgId,
      });
    }

    const organization = await getOrganization(repository.orgId);

    if (!organization) {
      LOGGER.warn("Couldn't load organization for repository from our database", {
        repositoryId: event.repository.id,
        organizationId: repository.orgId,
      });
      return;
    }

    // TODO: if we want to support multiple slack channels per organization, we'll
    // need to change this.
    const slackIntegrations = await getSlackInstallationsForOrganization(
      repository.orgId,
    );
    const slackIntegration = slackIntegrations[0] ?? null;

    if (!slackIntegration) {
      LOGGER.info(
        "Recieved event for active repository in organization with no enabled slack app",
        {
          repositoryId: event.repository.id,
          organizationId: repository.orgId,
        },
      );
      return;
    }

    if (!slackIntegration.channelId || !slackIntegration.accessToken) {
      LOGGER.warn("Slack integration missing required fields", {
        hasChannelId: !!slackIntegration.channelId,
        hasAccessToken: !!slackIntegration.accessToken,
      });
      return;
    }

    // Check if we need to warn about outdated scopes
    if (shouldWarnAboutScopes(slackIntegration)) {
      const frontendUrl = process.env.BASE_FE_URL;
      if (!frontendUrl) {
        LOGGER.error("BASE_FE_URL environment variable not set");
      } else {
        const tempSlackClient = new SlackClient(
          slackIntegration.channelId,
          slackIntegration.accessToken,
        );

        const warningSuccess = await sendScopeWarning(
          tempSlackClient,
          repository.orgId,
          frontendUrl,
        );

        if (warningSuccess) {
          await updateLastChecked(slackIntegration.id, new Date());
        }
      }
    }

    const slackClient = new SlackClient(
      slackIntegration.channelId,
      slackIntegration.accessToken,
    );

    LOGGER.debug("Loaded handler props, now running event handler", {
      eventName,
    });

    await eventHandlers[eventName as handledEventNames].handler({
      event,
      slackClient,
      installationId: organization.installationId,
      organizationId: organization.id,
    });
  } else {
    LOGGER.debug("Recieved event we're not handling", { eventName });
  }
};
