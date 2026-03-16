import {
  getInstallationAccessToken,
  getPullRequestInfo,
} from "@domain/github/fetchers";
import { Logger } from "@domain/logging";
import {
  type OrgSlackReminders,
  type PrReminder,
  fetchOutstandingPrsForReminders,
  groupPrsByOrgAndSlack,
} from "@domain/postgres/fetchers/pr-reminders";
import { updatePullRequest } from "@domain/postgres/fetchers/pull-requests";
import { PullRequestStatus, type PullRequestStatusType } from "@domain/postgres/schema";
import { SlackClient } from "@domain/slack/SlackClient";
import { buildPrReminderMessage } from "@domain/slack/prReminderMessage";
import type { ScheduledEvent } from "aws-lambda";

const LOGGER = new Logger("cron.prReminders");

const MAX_PRS_PER_GROUP = 10;

export async function handler(event: ScheduledEvent): Promise<void> {
  LOGGER.info("PR reminder job started", { time: event.time });

  const outstandingPrs = await fetchOutstandingPrsForReminders();
  LOGGER.info("Fetched outstanding PRs", { count: outstandingPrs.length });

  if (outstandingPrs.length === 0) {
    LOGGER.info("No outstanding PRs found, skipping reminders");
    return;
  }

  const grouped = groupPrsByOrgAndSlack(outstandingPrs);
  const groupsToProcess = Array.from(grouped.entries()).filter(([, orgReminders]) => {
    if (orgReminders.prs.length > MAX_PRS_PER_GROUP) {
      LOGGER.error("Too many pending PRs for org/slack group, skipping reminder", {
        orgId: orgReminders.orgId,
        channelId: orgReminders.channelId,
        prCount: orgReminders.prs.length,
        maxAllowed: MAX_PRS_PER_GROUP,
      });
      return false;
    }
    return true;
  });

  // Send reminders to each org/slack group
  for (const [key, orgReminders] of groupsToProcess) {
    let confirmedOpenPrs: PrReminder[];

    try {
      confirmedOpenPrs = await confirmOpenPrsForGroup(orgReminders, key);
    } catch (error) {
      LOGGER.error("Failed to confirm PRs for org/slack group, skipping reminder", {
        key,
        orgId: orgReminders.orgId,
        channelId: orgReminders.channelId,
        installationId: orgReminders.installationId,
        error,
      });
      continue;
    }

    if (confirmedOpenPrs.length === 0) {
      LOGGER.info("No open PRs after GitHub check, skipping reminder", {
        key,
        orgId: orgReminders.orgId,
        channelId: orgReminders.channelId,
      });
      continue;
    }

    LOGGER.info("Sending PR reminder", {
      key,
      orgId: orgReminders.orgId,
      channelId: orgReminders.channelId,
      prCount: confirmedOpenPrs.length,
    });

    const slackClient = new SlackClient(
      orgReminders.channelId,
      orgReminders.accessToken,
    );

    const message = buildPrReminderMessage(confirmedOpenPrs, orgReminders.channelId);

    const result = await slackClient.postMessage({
      message: {
        text: message.text,
        blocks: message.blocks,
        attachments: message.attachments,
      },
      threadTs: undefined,
    });

    if (result) {
      LOGGER.info("Successfully sent PR reminder", {
        key,
        messageTs: result.ts,
      });
    } else {
      LOGGER.error("Failed to send PR reminder", { key });
    }
  }

  LOGGER.info("PR reminder job completed", {
    groupsProcessed: groupsToProcess.length,
  });
}

async function confirmOpenPrsForGroup(
  orgReminders: OrgSlackReminders,
  key: string,
): Promise<PrReminder[]> {
  const accessToken = (await getInstallationAccessToken(orgReminders.installationId))
    .token;
  const confirmed: PrReminder[] = [];

  // TODO: we need to throttle this
  for (const pr of orgReminders.prs) {
    const prUrl =
      `https://api.github.com/repos/${orgReminders.orgName}/` +
      `${pr.repoName}/pulls/${pr.prNumber}`;

    try {
      const prInfo = await getPullRequestInfo({ url: prUrl, accessToken });
      const status = resolvePullRequestStatus(prInfo.state, prInfo.merged_at);

      await maybeUpdatePrStatus({
        repoId: pr.repoId,
        prId: pr.prId,
        status,
        mergedAt: prInfo.merged_at,
        closedAt: prInfo.closed_at,
      });

      if (status === PullRequestStatus.OPEN) {
        confirmed.push(pr);
      }
    } catch (error) {
      LOGGER.error("Failed to confirm PR status with GitHub, keeping reminder", {
        key,
        prId: pr.prId,
        repoName: pr.repoName,
        prNumber: pr.prNumber,
        error,
      });
      confirmed.push(pr);
    }
  }

  return confirmed;
}

function resolvePullRequestStatus(
  state: string,
  mergedAt: string | null,
): PullRequestStatusType {
  if (mergedAt) {
    return PullRequestStatus.MERGED;
  }

  if (state === "closed") {
    return PullRequestStatus.CLOSED;
  }

  return PullRequestStatus.OPEN;
}

async function maybeUpdatePrStatus({
  repoId,
  prId,
  status,
  mergedAt,
  closedAt,
}: {
  repoId: number;
  prId: number;
  status: PullRequestStatusType;
  mergedAt: string | null;
  closedAt: string | null;
}): Promise<void> {
  const updates: Parameters<typeof updatePullRequest>[0] = {
    repoId,
    pullRequestId: prId,
  };

  if (status !== PullRequestStatus.OPEN) {
    updates.status = status;
  }

  if (mergedAt) {
    updates.mergedAt = new Date(mergedAt);
  }

  if (closedAt) {
    updates.closedAt = new Date(closedAt);
  }

  if (updates.status || updates.mergedAt || updates.closedAt) {
    await updatePullRequest(updates);
  }
}
