import { tryCatch } from "@core/utils/errors/tryCatch";
import { Logger } from "@domain/logging";
import {
  fetchOutstandingPrsForReminders,
  groupPrsByOrgAndSlack,
} from "@domain/postgres/fetchers/pr-reminders";
import { SlackClient } from "@domain/slack/SlackClient";
import { buildPrReminderMessage } from "@domain/slack/prReminderMessage";
import type { ScheduledEvent } from "aws-lambda";

const LOGGER = new Logger("cron.prReminders");

export async function handler(event: ScheduledEvent): Promise<void> {
  // TODO: Re-enable once we add a status field to pull_requests table to track
  // open/closed/merged state. Currently PRs are never removed from the database
  // when closed/merged, causing stale PRs to appear in reminders.
  LOGGER.info("PR reminder job disabled", { time: event.time });
  return;

  const prsResult = await tryCatch(fetchOutstandingPrsForReminders());

  if (!prsResult.ok) {
    LOGGER.error("Failed to fetch outstanding PRs", { error: prsResult.error });
    throw prsResult.error;
  }

  const prs = prsResult.data;
  LOGGER.info("Fetched outstanding PRs", { count: prs.length });

  if (prs.length === 0) {
    LOGGER.info("No outstanding PRs found, skipping reminders");
    return;
  }

  const grouped = groupPrsByOrgAndSlack(prs);
  LOGGER.info("Grouped PRs by org/slack", { groupCount: grouped.size });

  const results = await Promise.allSettled(
    Array.from(grouped.values()).map(async (orgReminders) => {
      const slackClient = new SlackClient(
        orgReminders.channelId,
        orgReminders.accessToken,
      );

      const message = buildPrReminderMessage(orgReminders.prs, orgReminders.channelId);

      LOGGER.debug("Posting reminder to Slack", {
        orgId: orgReminders.orgId,
        channelId: orgReminders.channelId,
        prCount: orgReminders.prs.length,
      });

      const result = await slackClient.postMessage({
        message: {
          text: message.text,
          blocks: message.blocks,
          attachments: message.attachments,
        },
        threadTs: undefined,
      });

      return {
        orgId: orgReminders.orgId,
        success: !!result,
        prCount: orgReminders.prs.length,
      };
    }),
  );

  const successful = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  LOGGER.info("PR reminder job completed", {
    totalOrgs: grouped.size,
    successful,
    failed,
    totalPrs: prs.length,
  });

  if (failed > 0) {
    const failures = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
    for (const failure of failures) {
      LOGGER.error("Failed to send reminder", { error: failure.reason });
    }
  }
}
