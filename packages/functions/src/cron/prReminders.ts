import { Logger } from "@domain/logging";
import type { ScheduledEvent } from "aws-lambda";

const LOGGER = new Logger("cron.prReminders");

export async function handler(event: ScheduledEvent): Promise<void> {
  // TODO: Re-enable once we add a status field to pull_requests table to track
  // open/closed/merged state. Currently PRs are never removed from the database
  // when closed/merged, causing stale PRs to appear in reminders.
  LOGGER.info("PR reminder job disabled", { time: event.time });
  return;
}
