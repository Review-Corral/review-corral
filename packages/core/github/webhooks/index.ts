import { WebhookEventMap } from "@octokit/webhooks-types";
import * as z from "zod";
import { safeFetchRepository } from "../../db/fetchers/repositories";
import { takeFirst } from "../../db/fetchers/utils";
import { Logger } from "../../logging";
import { SlackClient } from "../../slack/SlackClient";
import { getSlackInstallationsForOrganization } from "../../slack/fetchers";

const LOGGER = new Logger("core.github.events");

// Purposefully leaving this out of the githubWebhookEventSchema so that we
// can parse them seperately
export const githubWebhookBodySchema = z.object({
  action: z.string(),
  repository: z.object({
    id: z.number(),
  }),
});

type githubWebhookBody = z.infer<typeof githubWebhookBodySchema>;

const handlePullRequestEvent = async () => {};
const handlePullRequestCommentEvent = async () => {};
const handlePullRequestReviewEvent = async () => {};

type handledEventNames = keyof Pick<
  WebhookEventMap,
  "pull_request" | "pull_request_review_comment" | "pull_request_review"
>;

const eventHandlers: Record<
  handledEventNames,
  {
    handler: (event: githubWebhookBody) => Promise<void>;
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
  if (eventName in eventHandlers) {
    const repository = await safeFetchRepository(event.repository.id);

    if (!repository) {
      LOGGER.info("Recieved event for repository not in the database", {
        repositoryId: event.repository.id,
      });
      return;
    }

    if (!repository.isActive) {
      LOGGER.info("Recieved event for inactive repository", {
        repositoryId: event.repository.id,
      });
    }

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

    await eventHandlers[eventName as handledEventNames].handler(event);
  } else {
    LOGGER.debug("Recieved event we're not handling", { eventName });
  }
};
