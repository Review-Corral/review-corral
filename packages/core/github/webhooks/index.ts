import { WebhookEvent, WebhookEventMap } from "@octokit/webhooks-types";
import { Logger } from "../../logging";

const LOGGER = new Logger("core.github.events");

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
    handler: (event: WebhookEvent) => Promise<void>;
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
  event: WebhookEvent;
  eventName: string;
}) => {
  if (eventName in eventHandlers) {
    // do setup

    await eventHandlers[eventName as handledEventNames].handler(event);
  } else {
    LOGGER.debug("Recieved event we're not handling", { eventName });
  }
};
