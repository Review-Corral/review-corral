import { fetchPrItem, updatePullRequest } from "@domain/dynamodb/fetchers/pullRequests";
import {
  getInstallationAccessToken,
  getNumberOfApprovals,
  getPullRequestInfo,
} from "@domain/github/fetchers";
import { Logger } from "@domain/logging";
import {} from "@domain/slack/SlackClient";
import { PullRequestReview, PullRequestReviewEvent } from "@octokit/webhooks-types";
import slackifyMarkdown from "slackify-markdown";
import { GithubWebhookEventHander } from "../types";
import { getSlackUserName } from "./shared";
import { convertPullRequestInfoToBaseProps } from "./utils";

const LOGGER = new Logger("github.handlers.pullRequestReview");

export const handlePullRequestReviewEvent: GithubWebhookEventHander<
  PullRequestReviewEvent
> = async ({ event, slackClient, ...args }) => {
  if (event.review.user.type === "Bot") {
    LOGGER.debug("Pull request review is from a bot--skipping");
    return;
  }

  if (event.action === "submitted") {
    if (event.review.state === "commented" && event.review.body === null) {
      // This means they left a comment on the PR, not an actual review comment
      return;
    }

    const pullRequestItem = await fetchPrItem({
      pullRequestId: event.pull_request.id,
      repoId: event.repository.id,
    });

    if (!pullRequestItem?.threadTs) {
      // write error log
      LOGGER.warn("Got a comment event but couldn't find the thread", {
        action: event.action,
        prId: event.pull_request.id,
      });

      return;
    }

    if (event.review.state === "approved") {
      await slackClient.postMessage({
        message: {
          text: `${await getSlackUserName(event.sender.login, args)} ${getReviewText(
            event.review,
          )}`,
          attachments: [
            {
              text: slackifyMarkdown(event.review.body ?? ""),
              color: "#fff",
            },
            {
              text: ":white_check_mark:",
              color: "#00BB00",
            },
          ],
        },
        threadTs: pullRequestItem.threadTs,
      });

      try {
        const accessToken = await getInstallationAccessToken(args.installationId);

        const numberOfApprovals = await getNumberOfApprovals({
          pullRequest: event.pull_request,
          accessToken: accessToken.token,
        });

        await updatePullRequest({
          pullRequestId: event.pull_request.id,
          repoId: event.repository.id,
          approvalCount: numberOfApprovals,
        });

        // We have to fetch PR info because there's no enough in this payload to reconstruct
        // the original message
        const pullRequestInfo = await getPullRequestInfo({
          url: event.pull_request.url,
          accessToken: accessToken.token,
        });

        await slackClient.updateMainMessage(
          {
            body: convertPullRequestInfoToBaseProps(pullRequestInfo),
            threadTs: pullRequestItem.threadTs,
            slackUsername: await getSlackUserName(event.pull_request.user.login, args),
            pullRequestItem: {
              ...pullRequestItem,
              // It's vital we pass this in so it updates the number of approvals
              // on the main message
              approvalCount: numberOfApprovals,
            },
            // Default to getting this from the PR item
            requiredApprovals: null,
          },
          "pr-approved",
        );
      } catch (error) {
        LOGGER.error("Error updating main PR message with number of approvals", {
          error,
        });
      }
    } else {
      await slackClient.postMessage({
        message: {
          text: `${await getSlackUserName(event.sender.login, args)} ${getReviewText(
            event.review,
          )}`,
          attachments: [
            {
              text: slackifyMarkdown(event.review.body ?? ""),
              color: "#fff",
            },
          ],
        },
        threadTs: pullRequestItem.threadTs,
      });
    }
  }
};

const getReviewText = (review: PullRequestReview) => {
  switch (review.state) {
    case "approved": {
      return "*approved* the pull request";
    }
    case "changes_requested": {
      return "*requested changes* to the pull request";
    }
    case "commented": {
      return "left a review comment on the pull request";
    }
  }
};
