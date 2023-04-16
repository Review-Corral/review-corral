import {
  PullRequestEvent,
  PullRequestReviewCommentEvent,
  PullRequestReviewEvent,
  WebhookEvent,
} from "@octokit/webhooks-types";
import { BasePrEventHandlerProps } from "./shared";

export const handlePullRequestEvent = async (
  event: PullRequestEvent,
  props: BasePrEventHandlerProps,
) => {
  if ("comment" in event) {
    handleCommentEvent(event, props);
  }
};

const isPullRequestEvent = (event: WebhookEvent): event is PullRequestEvent =>
  "pull_request" in event;

const isPullRequestReviewEvent = (
  event: WebhookEvent,
): event is PullRequestReviewEvent => "review" in event;

const handleCommentEvent = async (
  event: PullRequestReviewCommentEvent,
  props: BasePrEventHandlerProps,
) => {
  if (event.comment.user.type === "User") {
  }
};
