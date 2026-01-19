import type { BillingStatus } from "@core/dynamodb/entities/types";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export type SubscriptionCheckResult = {
  shouldContinueProcessing: boolean;
  shouldSendWarning: boolean;
  shouldSendServicePaused: boolean;
  shouldRecordPastDueStart: boolean;
  shouldClearBillingStatus: boolean;
  daysRemainingInGracePeriod: number | null;
};

/**
 * Checks if a subscription status indicates past_due (expired credit card).
 */
export function isSubscriptionPastDue(status: string | null): boolean {
  return status === "past_due";
}

/**
 * Checks if the billing status is still within the 7-day grace period.
 */
export function isWithinGracePeriod(
  pastDueStartedAt: string,
  now: Date = new Date(),
): boolean {
  const pastDueTime = new Date(pastDueStartedAt).getTime();
  const currentTime = now.getTime();
  const timeSincePastDue = currentTime - pastDueTime;
  return timeSincePastDue < SEVEN_DAYS_MS;
}

/**
 * Calculates the number of days remaining in the grace period.
 * Returns null if not in grace period or no billing status.
 */
export function getDaysRemainingInGracePeriod(
  pastDueStartedAt: string,
  now: Date = new Date(),
): number {
  const pastDueTime = new Date(pastDueStartedAt).getTime();
  const currentTime = now.getTime();
  const timeRemaining = SEVEN_DAYS_MS - (currentTime - pastDueTime);
  return Math.max(0, Math.ceil(timeRemaining / (24 * 60 * 60 * 1000)));
}

/**
 * Determines if we should send a payment warning (24+ hours since last warning).
 */
export function shouldSendPaymentWarning(
  lastWarningSentAt: string | undefined,
  now: Date = new Date(),
): boolean {
  if (!lastWarningSentAt) {
    return true;
  }

  const lastWarningTime = new Date(lastWarningSentAt).getTime();
  const currentTime = now.getTime();
  const timeSinceLastWarning = currentTime - lastWarningTime;
  return timeSinceLastWarning >= TWENTY_FOUR_HOURS_MS;
}

/**
 * Combined check returning all action flags for subscription status handling.
 */
export function checkSubscriptionStatus(
  subscriptionStatus: string | null,
  billingStatus: BillingStatus | null,
  now: Date = new Date(),
): SubscriptionCheckResult {
  const isPastDue = isSubscriptionPastDue(subscriptionStatus);

  // Not past due - clear any existing billing status and continue
  if (!isPastDue) {
    return {
      shouldContinueProcessing: true,
      shouldSendWarning: false,
      shouldSendServicePaused: false,
      shouldRecordPastDueStart: false,
      shouldClearBillingStatus: billingStatus !== null,
      daysRemainingInGracePeriod: null,
    };
  }

  // Past due but no billing status yet - first detection
  if (!billingStatus) {
    return {
      shouldContinueProcessing: true,
      shouldSendWarning: true,
      shouldSendServicePaused: false,
      shouldRecordPastDueStart: true,
      shouldClearBillingStatus: false,
      daysRemainingInGracePeriod: 7,
    };
  }

  const withinGracePeriod = isWithinGracePeriod(billingStatus.pastDueStartedAt, now);
  const daysRemaining = getDaysRemainingInGracePeriod(
    billingStatus.pastDueStartedAt,
    now,
  );

  // Grace period expired
  if (!withinGracePeriod) {
    // Only send service paused message once
    const shouldSendPaused = !billingStatus.servicePausedSentAt;
    return {
      shouldContinueProcessing: false,
      shouldSendWarning: false,
      shouldSendServicePaused: shouldSendPaused,
      shouldRecordPastDueStart: false,
      shouldClearBillingStatus: false,
      daysRemainingInGracePeriod: 0,
    };
  }

  // Within grace period - check if we should warn
  const shouldWarn = shouldSendPaymentWarning(billingStatus.lastWarningSentAt, now);

  return {
    shouldContinueProcessing: true,
    shouldSendWarning: shouldWarn,
    shouldSendServicePaused: false,
    shouldRecordPastDueStart: false,
    shouldClearBillingStatus: false,
    daysRemainingInGracePeriod: daysRemaining,
  };
}
