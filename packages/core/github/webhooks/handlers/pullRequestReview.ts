import {
  PullRequestReview,
  PullRequestReviewEvent,
} from "@octokit/webhooks-types";
import slackifyMarkdown from "slackify-markdown";
import { GithubWebhookEventHander } from "../types";
import { getSlackUserName, getThreadTs } from "./shared";

export const handlePullRequestReviewEvent: GithubWebhookEventHander<
  PullRequestReviewEvent
> = async ({ event, slackClient, ...args }) => {
  if (event.action === "submitted") {
    if (event.review.state === "commented" && event.review.body === null) {
      // This means they left a comment on the PR, not an actual review comment
      return;
    }

    const threadTs = await getThreadTs({
      prId: event.pull_request.id,
      repoId: event.repository.id,
    });

    if (!threadTs) {
      // write error log
      console.warn("Got a comment event but couldn't find the thread", {
        action: event.action,
        prId: event.pull_request.id,
      });

      return;
    }

    await slackClient.postMessage({
      message: {
        text: `${await getSlackUserName(
          event.sender.login,
          args
        )} ${getReviewText(event.review)}`,
        attachments: [
          {
            text: slackifyMarkdown(event.review.body ?? ""),
            color: "#fff",
          },
          ...[
            event.review.state === "approved" && {
              text: ":white_check_mark:",
              color: "#00BB00",
            },
          ],
        ],
      },
      threadTs,
    });
    return;
  }
};

const getReviewText = (review: PullRequestReview) => {
  switch (review.state) {
    case "approved": {
      return "approved the pull request";
    }
    case "changes_requested": {
      return "requested changes to the pull request";
    }
    case "commented": {
      return "left a review comment on the pull request";
    }
  }
};
