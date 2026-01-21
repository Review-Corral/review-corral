import { Logger } from "@domain/logging";
import {
  fetchOutstandingPrsForReminders,
  groupPrsByOrgAndSlack,
} from "@domain/postgres/fetchers/pr-reminders";
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

  // Check for groups exceeding the limit and remove them
  for (const [key, orgReminders] of grouped) {
    if (orgReminders.prs.length > MAX_PRS_PER_GROUP) {
      LOGGER.error("Too many pending PRs for org/slack group, skipping reminder", {
        orgId: orgReminders.orgId,
        channelId: orgReminders.channelId,
        prCount: orgReminders.prs.length,
        maxAllowed: MAX_PRS_PER_GROUP,
      });
      grouped.delete(key);
    }
  }

  // Send reminders to each org/slack group
  for (const [key, orgReminders] of grouped) {
    LOGGER.info("Sending PR reminder", {
      key,
      orgId: orgReminders.orgId,
      channelId: orgReminders.channelId,
      prCount: orgReminders.prs.length,
    });

    const slackClient = new SlackClient(
      orgReminders.channelId,
      orgReminders.accessToken,
    );

    const message = buildPrReminderMessage(orgReminders.prs, orgReminders.channelId);

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
    groupsProcessed: grouped.size,
  });
}
