import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies a Slack webhook request signature.
 * See: https://api.slack.com/authentication/verifying-requests-from-slack
 */
export function verifySlackRequest({
  signingSecret,
  signature,
  timestamp,
  body,
}: {
  signingSecret: string;
  signature: string;
  timestamp: string;
  body: string;
}): boolean {
  // Check timestamp to prevent replay attacks (5 minutes tolerance)
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
  if (Number.parseInt(timestamp, 10) < fiveMinutesAgo) {
    return false;
  }

  const sigBaseString = `v0:${timestamp}:${body}`;
  const hmac = createHmac("sha256", signingSecret);
  hmac.update(sigBaseString);
  const expectedSignature = `v0=${hmac.digest("hex")}`;

  // Use timing-safe comparison to prevent timing attacks
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    // timingSafeEqual throws if buffers have different lengths
    return false;
  }
}
