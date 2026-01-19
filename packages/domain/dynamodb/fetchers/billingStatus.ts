import type { BillingStatus } from "@core/dynamodb/entities/types";
import { Logger } from "@domain/logging";
import { Db } from "../client";

const LOGGER = new Logger("fetchers.billingStatus");

/**
 * Fetches the billing status record for an organization.
 */
export async function getBillingStatus(orgId: number): Promise<BillingStatus | null> {
  const result = await Db.entities.billingStatus.query
    .primary({ orgId })
    .go()
    .then(({ data }) => (data.length > 0 ? data[0] : null));

  return result;
}

/**
 * Records when past_due status was first detected and sends first warning.
 */
export async function recordPastDueStart(orgId: number): Promise<BillingStatus> {
  const now = new Date().toISOString();

  const result = await Db.entities.billingStatus
    .put({
      orgId,
      pastDueStartedAt: now,
      lastWarningSentAt: now,
    })
    .go()
    .then(({ data }) => data);

  LOGGER.info("Recorded past_due start for organization", { orgId });
  return result;
}

/**
 * Updates the lastWarningSentAt timestamp.
 */
export async function recordWarningSent(orgId: number): Promise<void> {
  const now = new Date().toISOString();

  await Db.entities.billingStatus
    .update({ orgId })
    .set({ lastWarningSentAt: now })
    .go();

  LOGGER.info("Recorded warning sent for organization", { orgId });
}

/**
 * Records when the service paused message was sent.
 */
export async function recordServicePausedSent(orgId: number): Promise<void> {
  const now = new Date().toISOString();

  await Db.entities.billingStatus
    .update({ orgId })
    .set({ servicePausedSentAt: now })
    .go();

  LOGGER.info("Recorded service paused message sent for organization", { orgId });
}

/**
 * Clears the billing status record for an organization.
 * This is called when the subscription status is no longer past_due,
 * effectively resetting the grace period.
 */
export async function clearBillingStatus(orgId: number): Promise<void> {
  await Db.entities.billingStatus.delete({ orgId }).go();

  LOGGER.info("Cleared billing status for organization", { orgId });
}
