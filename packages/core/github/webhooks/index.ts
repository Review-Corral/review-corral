import { eq } from "drizzle-orm";
import * as z from "zod";
import { DB } from "../../db/db";
import { getSlackInstallationsForOrganization } from "../../db/fetchers/slack";
import { takeFirst } from "../../db/fetchers/utils";
import { organizations, repositories } from "../../db/schema";
import { Logger } from "../../logging";
import { SlackClient } from "../../slack/SlackClient";
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
      })
      .passthrough(),
  })
  .passthrough();

export type githubWebhookBody = z.infer<typeof githubWebhookBodySchema>;

const eventHandlers: Record<
  handledEventNames,
  {
    handler: GithubWebhookEventHander<any>;
  }
> = {
  pull_request: { handler: handlePullRequestEvent },
  pull_request_review_comment: { handler: handlePullRequestCommentEvent },
  pull_request_review: { handler: handlePullRequestReviewEvent },
};

export const handleGithubWebhookEvent = async ({
  event,
  eventName,
}: {
  event: githubWebhookBody;
  eventName: string;
}) => {
  LOGGER.debug("Handling event body", { event, eventName });
  if (eventName in eventHandlers) {
    const repository = await DB.select({
      repositoryId: repositories.id,
      isActive: repositories.isActive,
      organizationId: organizations.id,
      installationId: organizations.installationId,
    })
      .from(repositories)
      .where(eq(repositories.id, event.repository.id))
      .fullJoin(
        organizations,
        eq(organizations.id, repositories.organizationId)
      )
      .then(takeFirst);

    if (
      !repository ||
      !repository.organizationId ||
      !repository.installationId
    ) {
      LOGGER.info("Recieved event for repository not in the database", {
        repositoryId: event.repository.id,
        organizationId: repository?.organizationId,
        installationId: repository?.installationId,
      });
      return;
    }

    if (!repository.isActive) {
      LOGGER.info("Recieved event for inactive repository", {
        repositoryId: event.repository.id,
      });
    }

    // TODO: if we want to support multiple slack channels per organization, we'll
    // need to change this.
    const slackIntegration = await getSlackInstallationsForOrganization(
      repository.organizationId
    ).then(takeFirst);

    if (!slackIntegration) {
      LOGGER.info(
        "Recieved event for active repository in organization with no enabled slack app",
        {
          repositoryId: event.repository.id,
          organizationId: repository.organizationId,
        }
      );
      return;
    }

    const slackClient = new SlackClient(
      slackIntegration.channelId,
      slackIntegration.accessToken
    );

    LOGGER.debug("Loaded handler props, now running event handler", {
      eventName,
    });

    await eventHandlers[eventName as handledEventNames].handler({
      event,
      slackClient,
      installationId: repository.installationId,
      organizationId: repository.organizationId,
    });
  } else {
    LOGGER.debug("Recieved event we're not handling", { eventName });
  }
};
