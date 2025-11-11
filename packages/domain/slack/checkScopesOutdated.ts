import type { SlackIntegration } from "../postgres/schema/slack-integrations";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Determines if we should warn about outdated scopes for a Slack integration.
 *
 * Returns true if:
 * 1. The scopes field is empty (indicating outdated scopes)
 * 2. AND either we've never checked before (lastChecked is null) OR it's been
 *    more than 24 hours since the last check
 *
 * This prevents spamming the Slack channel with warnings while ensuring users
 * are reminded at least once per day if their scopes remain outdated.
 */
export function shouldWarnAboutScopes(
  integration: SlackIntegration,
): boolean {
  // Only warn if scopes are empty (indicating outdated/missing scopes)
  if (integration.scopes !== "") {
    return false;
  }

  // If we've never checked before, we should warn
  if (integration.lastChecked === null) {
    return true;
  }

  // Check if it's been more than 24 hours since the last check
  const lastCheckedTime = new Date(integration.lastChecked).getTime();
  const currentTime = new Date().getTime();
  const timeSinceLastCheck = currentTime - lastCheckedTime;

  return timeSinceLastCheck > TWENTY_FOUR_HOURS_MS;
}
