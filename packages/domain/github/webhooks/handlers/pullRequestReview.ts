import { COLOURS } from "@core/slack/const";
import {
  getInstallationAccessToken,
  getNumberOfApprovals,
  getPullRequestInfo,
} from "@domain/github/fetchers";
import { Logger } from "@domain/logging";
import {
  fetchPrItem,
  updatePullRequest,
} from "@domain/postgres/fetchers/pull-requests";
import { findReviewRequestDm } from "@domain/postgres/fetchers/review-request-dms";
import { PullRequestReview, PullRequestReviewEvent } from "@octokit/webhooks-types";
import slackifyMarkdown from "slackify-markdown";
import { GithubWebhookEventHander } from "../types";
import {
  getDmAttachment,
  getReviewRequestDmAttachment,
  getSlackUserId,
  getSlackUserName,
} from "./shared";
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

    // Update the reviewer's DM to show they've submitted their review
    await updateReviewerDm({
      pullRequestId: event.pull_request.id,
      reviewerGithubUsername: event.sender.login,
      reviewState: event.review.state,
      pullRequest: event.pull_request,
      repository: event.repository,
      slackClient,
      args,
    });

    if (event.review.state === "approved") {
      // Send DM to PR author
      const authorSlackId = await getSlackUserId(event.pull_request.user.login, args);
      if (authorSlackId) {
        await slackClient.postDirectMessage({
          slackUserId: authorSlackId,
          message: {
            text: `✅ ${await getSlackUserName(event.sender.login, args)} approved your PR`,
            attachments: [
              getDmAttachment(
                {
                  title: event.pull_request.title,
                  number: event.pull_request.number,
                  html_url: event.pull_request.html_url,
                },
                "green",
              ),
              ...(event.review.body
                ? [
                    {
                      text: slackifyMarkdown(event.review.body),
                      color: "green",
                    },
                  ]
                : []),
            ],
          },
        });
      }

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
      // Send DM to PR author
      const authorSlackId = await getSlackUserId(event.pull_request.user.login, args);
      if (authorSlackId) {
        const reviewParams = getReviewParams(event.review);
        if (reviewParams) {
          await slackClient.postDirectMessage({
            slackUserId: authorSlackId,
            message: {
              text: `${reviewParams.emoji} ${await getSlackUserName(event.sender.login, args)} ${reviewParams.text}`,
              attachments: [
                getDmAttachment(
                  {
                    title: event.pull_request.title,
                    number: event.pull_request.number,
                    html_url: event.pull_request.html_url,
                  },
                  reviewParams.color,
                ),
                ...(event.review.body
                  ? [
                      {
                        text: slackifyMarkdown(event.review.body),
                        color: reviewParams.color,
                      },
                    ]
                  : []),
              ],
            },
          });
        }
      }
    }
  }
};

const getReviewParams = (
  review: PullRequestReview,
): { text: string; color: keyof typeof COLOURS; emoji: string } | undefined => {
  switch (review.state) {
    case "approved": {
      return {
        text: "*approved* the pull request",
        color: "green",
        emoji: ":white_check_mark:",
      };
    }
    case "changes_requested": {
      return {
        text: "*requested changes* to the pull request",
        color: "yellow",
        emoji: ":warning:",
      };
    }
    case "commented": {
      return {
        text: "left a review comment on the pull request",
        color: "white",
        emoji: ":speech_balloon:",
      };
    }
  }
};

/**
 * Returns the message text and color for updating a reviewer's DM
 * based on their review state.
 */
const getReviewerDmParams = (
  reviewState: PullRequestReview["state"],
): { text: string; color: keyof typeof COLOURS } | undefined => {
  switch (reviewState) {
    case "approved":
      return { text: "✅ You approved this PR", color: "green" };
    case "changes_requested":
      return { text: "⚠️ You requested changes", color: "yellow" };
    case "commented":
      return { text: "💬 You left a review comment", color: "gray" };
  }
};

/**
 * Updates the reviewer's original review request DM to show they've submitted their review.
 * This helps reviewers scan their DM history to see which PRs still need their attention.
 */
async function updateReviewerDm({
  pullRequestId,
  reviewerGithubUsername,
  reviewState,
  pullRequest,
  repository,
  slackClient,
  args,
}: {
  pullRequestId: number;
  reviewerGithubUsername: string;
  reviewState: PullRequestReview["state"];
  pullRequest: {
    title: string;
    number: number;
    html_url: string;
    body: string | null;
    additions?: number;
    deletions?: number;
    base: { ref: string };
    user: { avatar_url: string; login: string };
  };
  repository: {
    full_name: string;
    owner: { avatar_url: string };
  };
  slackClient: import("@domain/slack/SlackClient").SlackClient;
  args: { organizationId: number };
}): Promise<void> {
  const reviewRequestDm = await findReviewRequestDm({
    pullRequestId,
    reviewerGithubUsername,
  });

  if (!reviewRequestDm) {
    // No tracked DM found - reviewer may not have been explicitly requested
    return;
  }

  const reviewerDmParams = getReviewerDmParams(reviewState);
  if (!reviewerDmParams) {
    return;
  }

  const authorSlackUsername = await getSlackUserName(pullRequest.user.login, args);

  await slackClient.updateDirectMessage({
    channelId: reviewRequestDm.slackChannelId,
    messageTs: reviewRequestDm.slackMessageTs,
    message: {
      text: reviewerDmParams.text,
      attachments: [
        getReviewRequestDmAttachment(
          {
            title: pullRequest.title,
            number: pullRequest.number,
            html_url: pullRequest.html_url,
            body: pullRequest.body,
            additions: pullRequest.additions ?? 0,
            deletions: pullRequest.deletions ?? 0,
            base: pullRequest.base,
            user: pullRequest.user,
          },
          repository,
          authorSlackUsername,
          reviewerDmParams.color,
        ),
      ],
    },
  });
}
