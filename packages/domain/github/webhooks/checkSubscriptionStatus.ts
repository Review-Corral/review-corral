import {
  clearBillingStatus,
  getBillingStatus,
  recordPastDueStart,
  recordServicePausedSent,
  recordWarningSent,
} from "@domain/dynamodb/fetchers/billingStatus";
import { Logger } from "@domain/logging";
import { updateLastChecked } from "@domain/postgres/fetchers/slack-integrations";
import { fetchSubscriptionsByOrgId } from "@domain/postgres/fetchers/subscriptions";
import type { Organization } from "@domain/postgres/schema/organizations";
import type { SlackIntegration } from "@domain/postgres/schema/slack-integrations";
import { SlackClient } from "@domain/slack/SlackClient";
import { shouldWarnAboutScopes } from "@domain/slack/checkScopesOutdated";
import { checkSubscriptionStatus as getSubscriptionCheckResult } from "@domain/slack/checkSubscriptionStatus";
import { sendPaymentWarning } from "@domain/slack/sendPaymentWarning";
import { sendScopeWarning } from "@domain/slack/sendScopeWarning";
import { sendServicePausedMessage } from "@domain/slack/sendServicePausedMessage";

const LOGGER = new Logger("domain.github.webhooks.checkSubscriptionStatus");

type SlackIntegrationWithRequiredFields = SlackIntegration & {
  channelId: string;
  accessToken: string;
};

/**
 * Checks subscription status and sends warnings if needed.
 * Returns false if webhook processing should stop (e.g., grace period expired).
 */
export async function checkSubscriptionStatus(
  organization: Organization,
  slackIntegration: SlackIntegrationWithRequiredFields,
): Promise<boolean> {
  const frontendUrl = process.env.BASE_FE_URL;

  // Check subscription status for payment issues
  const orgSubscriptions = await fetchSubscriptionsByOrgId(organization.id);
  const subscriptionStatus = orgSubscriptions[0]?.status ?? null;
  const billingStatus = await getBillingStatus(organization.id);
  const subscriptionCheck = getSubscriptionCheckResult(
    subscriptionStatus,
    billingStatus,
  );

  if (subscriptionCheck.shouldClearBillingStatus) {
    await clearBillingStatus(organization.id);
  }

  if (subscriptionCheck.shouldRecordPastDueStart) {
    await recordPastDueStart(organization.id);
  }

  if (subscriptionCheck.shouldSendServicePaused) {
    if (!frontendUrl) {
      LOGGER.error("BASE_FE_URL environment variable not set");
    } else {
      const slackClient = new SlackClient(
        slackIntegration.channelId,
        slackIntegration.accessToken,
      );
      const sent = await sendServicePausedMessage(
        slackClient,
        organization.id,
        frontendUrl,
      );
      if (sent) {
        await recordServicePausedSent(organization.id);
      }
    }
  }

  if (!subscriptionCheck.shouldContinueProcessing) {
    LOGGER.info("Stopping webhook processing - subscription grace period expired", {
      organizationId: organization.id,
    });
    return false;
  }

  if (subscriptionCheck.shouldSendWarning) {
    if (!frontendUrl) {
      LOGGER.error("BASE_FE_URL environment variable not set");
    } else {
      const slackClient = new SlackClient(
        slackIntegration.channelId,
        slackIntegration.accessToken,
      );
      const sent = await sendPaymentWarning(
        slackClient,
        organization.id,
        frontendUrl,
        subscriptionCheck.daysRemainingInGracePeriod ?? 7,
      );
      if (sent) {
        await recordWarningSent(organization.id);
      }
    }
  }

  // Check if we need to warn about outdated scopes
  if (shouldWarnAboutScopes(slackIntegration)) {
    if (!frontendUrl) {
      LOGGER.error("BASE_FE_URL environment variable not set");
    } else {
      const slackClient = new SlackClient(
        slackIntegration.channelId,
        slackIntegration.accessToken,
      );
      const warningSuccess = await sendScopeWarning(
        slackClient,
        organization.id,
        frontendUrl,
      );
      if (warningSuccess) {
        await updateLastChecked(slackIntegration.id, new Date());
      }
    }
  }

  return true;
}
