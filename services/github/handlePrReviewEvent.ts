import {
  PullRequestReview,
  PullRequestReviewEvent,
} from "@octokit/webhooks-types";
import slackifyMarkdown from "slackify-markdown";
import { BaseGithubHanderProps, getSlackUserName, getThreadTs } from "./shared";

export const handlePullRequestReviewEvent = async (
  payload: PullRequestReviewEvent,
  props: BaseGithubHanderProps,
) => {
  if (payload.action === "submitted") {
    if (payload.review.state === "commented" && payload.review.body === null) {
      // This means they left a comment on the PR, not an actual review comment
      return;
    }

    const threadTs = await getThreadTs(payload.pull_request.id, props.database);

    if (!threadTs) {
      // write error log
      console.warn("Got a comment event but couldn't find the thread", {
        action: payload.action,
        prId: payload.pull_request.id,
      });

      return;
    }

    await props.slackClient.postMessage({
      message: {
        text: `${await getSlackUserName(
          payload.sender.login,
          props,
        )} ${getReviewText(payload.review)}`,
        attachments: [
          {
            text: slackifyMarkdown(payload.review.body ?? ""),
            color: "#fff",
          },
          ...[
            payload.review.state === "approved" && {
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
