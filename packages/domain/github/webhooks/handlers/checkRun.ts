import { fetchPrItem } from "@domain/dynamodb/fetchers/pullRequests";
import { aggregateCheckStatus } from "@domain/github/checkStatus";
import {
  getInstallationAccessToken,
  getPullRequestCheckRuns,
  getPullRequestInfo,
} from "@domain/github/fetchers";
import { Logger } from "@domain/logging";
import { CheckRunEvent } from "@octokit/webhooks-types";
import { GithubWebhookEventHander } from "../types";
import { getSlackUserName } from "./shared";

const LOGGER = new Logger("core.github.webhooks.handlers.checkRun");

export const handleCheckRunEvent: GithubWebhookEventHander<CheckRunEvent> = async ({
  event: payload,
  slackClient,
  installationId,
  ...props
}) => {
  LOGGER.debug("Handling check run event with action: ", payload.action);

  // Only handle completed check runs for now
  if (payload.action !== "completed") {
    LOGGER.debug("Ignoring non-completed check run action", {
      action: payload.action,
    });
    return;
  }

  // Find the PR associated with this check run
  const pullRequest = payload.check_run.pull_requests?.[0];
  if (!pullRequest) {
    LOGGER.debug("Check run not associated with any PR", {
      checkRunId: payload.check_run.id,
    });
    return;
  }

  const pullRequestItem = await fetchPrItem({
    pullRequestId: pullRequest.id,
    repoId: payload.repository.id,
  });

  if (!pullRequestItem?.threadTs) {
    LOGGER.debug("No thread found for PR associated with check run", {
      prId: pullRequest.id,
      checkRunId: payload.check_run.id,
    });
    return;
  }

  // Get full PR information and check status
  let checkStatus = null;
  let fullPrInfo = null;
  let slackUsername = "@unknown";

  try {
    const accessToken = await getInstallationAccessToken(installationId);

    // Fetch full PR info from GitHub API
    fullPrInfo = await getPullRequestInfo({
      url: pullRequest.url,
      accessToken: accessToken.token,
    });

    // Get slack username from the PR author
    slackUsername = await getSlackUserName(fullPrInfo.user.login, props);

    // Fetch current check status
    const checkRuns = await getPullRequestCheckRuns({
      repoOwner: payload.repository.owner.login,
      repoName: payload.repository.name,
      sha: payload.check_run.head_sha,
      accessToken: accessToken.token,
    });
    checkStatus = aggregateCheckStatus(checkRuns);
  } catch (error) {
    LOGGER.error("Failed to fetch PR info or check status", {
      error,
      prId: pullRequest.id,
      checkRunId: payload.check_run.id,
    });
  }

  // Update the main PR message with new check status
  await slackClient.updateMainMessage(
    {
      body: {
        pull_request: {
          title: fullPrInfo?.title || "Unknown PR",
          number: fullPrInfo?.number || 0,
          html_url: fullPrInfo?.html_url || "",
          body: fullPrInfo?.body || "",
          user: {
            avatar_url: fullPrInfo?.user.avatar_url || "",
            login: fullPrInfo?.user.login || "unknown",
          },
          additions: fullPrInfo?.additions || 0,
          deletions: fullPrInfo?.deletions || 0,
          base: {
            ref: fullPrInfo?.base.ref || "main",
          },
          merged: fullPrInfo?.merged || false,
          draft: fullPrInfo?.draft || false,
          closed_at: fullPrInfo?.closed_at || null,
        },
        repository: {
          full_name: payload.repository.full_name,
          owner: {
            avatar_url: payload.repository.owner.avatar_url,
          },
        },
      },
      threadTs: pullRequestItem.threadTs,
      slackUsername,
      pullRequestItem,
      requiredApprovals: pullRequestItem.requiredApprovals
        ? { count: pullRequestItem.requiredApprovals }
        : null,
      checkStatus,
    },
    "check-run-completed",
  );
};
