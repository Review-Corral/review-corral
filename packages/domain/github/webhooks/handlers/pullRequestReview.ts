import { PullRequestReview, PullRequestReviewEvent } from "@octokit/webhooks-types";
import slackifyMarkdown from "slackify-markdown";
import { GithubWebhookEventHander } from "../types";
import { getSlackUserName } from "./shared";
import {
  getInstallationAccessToken,
  getPullRequestInfo,
} from "@domain/github/fetchers";
import ky from "ky";
import {
  BranchProtectionResponse,
  InstallationAccessTokenResponse,
  PullRequestReviewsResponse,
} from "@domain/github/endpointTypes";
import { Logger } from "@domain/logging";
import {} from "@domain/slack/SlackClient";
import { convertPullRequestInfoToBaseProps } from "./utils";
import {
  forceFetchPrItem,
  updatePullRequest,
} from "@domain/dynamodb/fetchers/pullRequests";

const LOGGER = new Logger("github.handlers.pullRequestReview");

export const handlePullRequestReviewEvent: GithubWebhookEventHander<
  PullRequestReviewEvent
> = async ({ event, slackClient, ...args }) => {
  if (event.action === "submitted") {
    if (event.review.state === "commented" && event.review.body === null) {
      // This means they left a comment on the PR, not an actual review comment
      return;
    }

    const pullRequestItem = await forceFetchPrItem({
      pullRequestId: event.pull_request.id,
      repoId: event.repository.id,
    });

    if (!pullRequestItem?.threadTs) {
      // write error log
      console.warn("Got a comment event but couldn't find the thread", {
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

        const { requiredApprovals, numberOfApprovals } = await getNumberOfApprovals(
          event,
          accessToken,
        );

        await updatePullRequest({
          pullRequestId: event.pull_request.id,
          repoId: event.repository.id,
          requiredApprovals,
          approvalCount: numberOfApprovals,
        });

        const pullRequestInfo = await getPullRequestInfo({
          url: event.pull_request.url,
          accessToken: accessToken.token,
        });

        const converted = convertPullRequestInfoToBaseProps(pullRequestInfo);

        await slackClient.updateMainPrMessage({
          body: converted,
          threadTs: pullRequestItem.threadTs,
          slackUsername: await getSlackUserName(event.sender.login, args),
          pullRequestItem: {
            ...pullRequestItem,
            approvalCount: numberOfApprovals,
            requiredApprovals,
          },
        });
      } catch (error) {
        LOGGER.error("Error updating main PR message with number of approvals", {
          error,
        });
      }
    }

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
          ...[
            event.review.state === "changes_requested" && {
              text: ":building_construction:",
              color: "#FFC828",
            },
          ],
        ],
      },
      threadTs: pullRequestItem.threadTs,
    });
    return;
  }
};

const getNumberOfApprovals = async (
  event: PullRequestReviewEvent,
  accessToken: InstallationAccessTokenResponse,
) => {
  const response = await ky
    .get(`${event.pull_request.url}/reviews`, {
      headers: {
        Authorization: `bearer ${accessToken.token}`,
      },
    })
    .json<PullRequestReviewsResponse>();

  LOGGER.debug("Got reviews for PR", {
    reviews: response,
  });

  const branchProtectionResponse = await ky
    .get(`${event.repository.url}/branches/${event.pull_request.base.ref}/protection`, {
      headers: {
        Authorization: `bearer ${accessToken.token}`,
        Accept: "application/vnd.github.luke-cage-preview+json", // Required for branch protection API
      },
    })
    .json<BranchProtectionResponse>();

  LOGGER.debug("Got branch protection for PR", {
    branchProtection: branchProtectionResponse,
  });

  const requiredApprovals =
    branchProtectionResponse.required_pull_request_reviews
      ?.required_approving_review_count ?? 0;

  // Count approved reviews
  const approvedReviews = response.filter(
    (review: PullRequestReviewsResponse[number]) => review.state === "APPROVED",
  ).length;

  return {
    requiredApprovals,
    numberOfApprovals: approvedReviews,
  };
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
