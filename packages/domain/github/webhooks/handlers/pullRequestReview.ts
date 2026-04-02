import { COLOURS } from "@core/slack/const";
import {
  getInstallationAccessToken,
  getNumberOfApprovals,
  getPullRequestInfo,
} from "@domain/github/fetchers";
import { Logger } from "@domain/logging";
import {
  type PullRequestWithAlias,
  fetchPrItem,
  updatePullRequest,
} from "@domain/postgres/fetchers/pull-requests";
import { findReviewRequestDm } from "@domain/postgres/fetchers/review-request-dms";
import { SlackClient } from "@domain/slack/SlackClient";
import { PullRequestReview, PullRequestReviewEvent } from "@octokit/webhooks-types";
import slackifyMarkdown from "slackify-markdown";
import { GithubWebhookEventHander } from "../types";
import {
  applySubmittedReviewToReviewerStatuses,
  removeReviewerFromReviewerStatuses,
  syncReviewerStatusesWithRequestedReviewers,
} from "./reviewerStatuses";
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

  if (event.action !== "submitted" && event.action !== "dismissed") {
    return;
  }

  const pullRequestItem = await fetchPrItem({
    pullRequestId: event.pull_request.id,
    repoId: event.repository.id,
  });

  if (!pullRequestItem?.threadTs) {
    LOGGER.warn("Got a review event but couldn't find the thread", {
      action: event.action,
      prId: event.pull_request.id,
    });

    return;
  }

  const reviewerStatuses =
    event.action === "dismissed"
      ? syncReviewerStatusesWithRequestedReviewers({
          currentStatuses: removeReviewerFromReviewerStatuses({
            currentStatuses: pullRequestItem.reviewerStatuses ?? [],
            reviewerLogin: event.review.user.login,
          }),
          requestedReviewerLogins: pullRequestItem.requestedReviewers ?? [],
        })
      : await handleSubmittedReview({
          event,
          slackClient,
          pullRequestItem,
          organizationId: args.organizationId,
        });

  if (!reviewerStatuses) {
    return;
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
      reviewerStatuses,
    });

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
          approvalCount: numberOfApprovals,
          reviewerStatuses,
        },
        requiredApprovals: null,
      },
      event.action === "dismissed" ? "pr-review-dismissed" : "pr-review-submitted",
    );
  } catch (error) {
    LOGGER.error("Error updating main PR message after review change", {
      error,
    });
  }
};

async function handleSubmittedReview({
  event,
  slackClient,
  organizationId,
  pullRequestItem,
}: {
  event: Extract<PullRequestReviewEvent, { action: "submitted" }>;
  slackClient: SlackClient;
  organizationId: number;
  pullRequestItem: PullRequestWithAlias;
}) {
  if (event.review.state === "dismissed") {
    LOGGER.debug("Pull request review was submitted with dismissed state--skipping");
    return null;
  }

  if (event.review.state === "commented" && event.review.body === null) {
    // This means they left a comment on the PR, not an actual review comment
    return null;
  }

  await updateReviewerDm({
    event,
    slackClient,
    organizationId,
    pullRequestItem,
  });

  await notifyPrAuthorOfSubmittedReview({
    event,
    slackClient,
    organizationId,
  });

  return applySubmittedReviewToReviewerStatuses({
    currentStatuses: pullRequestItem.reviewerStatuses ?? [],
    reviewerLogin: event.review.user.login,
    reviewState: event.review.state,
  });
}

async function notifyPrAuthorOfSubmittedReview({
  event,
  slackClient,
  organizationId,
}: {
  event: Extract<PullRequestReviewEvent, { action: "submitted" }>;
  slackClient: SlackClient;
  organizationId: number;
}) {
  const authorSlackId = await getSlackUserId(event.pull_request.user.login, {
    organizationId,
  });

  if (!authorSlackId) {
    return;
  }

  if (event.review.state === "approved") {
    await slackClient.postDirectMessage({
      slackUserId: authorSlackId,
      message: {
        text: `✅ ${await getSlackUserName(event.sender.login, { organizationId })} approved your PR`,
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
    return;
  }

  const reviewParams = getReviewParams(event.review);
  if (!reviewParams) {
    return;
  }

  await slackClient.postDirectMessage({
    slackUserId: authorSlackId,
    message: {
      text: `${reviewParams.emoji} ${await getSlackUserName(event.sender.login, { organizationId })} ${reviewParams.text}`,
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
 * Updates the reviewer's DM to show they submitted their review.
 * Finds the latest review request DM for this reviewer and updates its attachment.
 */
async function updateReviewerDm({
  event,
  slackClient,
  organizationId,
  pullRequestItem,
}: {
  event: PullRequestReviewEvent;
  slackClient: SlackClient;
  organizationId: number;
  pullRequestItem: PullRequestWithAlias;
}): Promise<void> {
  const reviewerLogin = event.review.user.login;

  const dmRecord = await findReviewRequestDm({
    pullRequestId: event.pull_request.id,
    reviewerGithubUsername: reviewerLogin,
  });

  if (!dmRecord) {
    LOGGER.warn("No review request DM found to update", {
      pullRequestId: event.pull_request.id,
      reviewerLogin,
    });
    return;
  }

  const dmParams = getReviewerDmParams(event.review.state);
  if (!dmParams) {
    return;
  }

  const authorSlackUsername = await getSlackUserName(event.pull_request.user.login, {
    organizationId,
  });

  await slackClient.updateDirectMessage({
    channelId: dmRecord.slackChannelId,
    messageTs: dmRecord.slackMessageTs,
    message: {
      text: dmParams.text,
      attachments: [
        getReviewRequestDmAttachment(
          {
            title: event.pull_request.title,
            number: event.pull_request.number,
            html_url: event.pull_request.html_url,
            body: event.pull_request.body,
            additions: pullRequestItem.additions ?? 0,
            deletions: pullRequestItem.deletions ?? 0,
            base: event.pull_request.base,
            user: event.pull_request.user,
          },
          {
            full_name: event.repository.full_name,
            owner: event.repository.owner,
          },
          authorSlackUsername,
          dmParams.color,
        ),
      ],
    },
  });
}

/**
 * Gets display parameters for updating a reviewer's DM based on their review state.
 */
function getReviewerDmParams(
  state: PullRequestReview["state"],
): { text: string; color: keyof typeof COLOURS } | undefined {
  switch (state) {
    case "approved":
      return { text: "✅ You approved this PR", color: "green" };
    case "changes_requested":
      return { text: "⚠️ You requested changes on this PR", color: "yellow" };
    case "commented":
      return { text: "💬 You reviewed this PR", color: "white" };
  }
}
