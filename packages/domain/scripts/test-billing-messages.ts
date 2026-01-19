/**
 * Script to post billing warning messages to Slack for testing.
 *
 * Run with: bun packages/domain/scripts/test-billing-messages.ts
 */
require("dotenv").config({ path: ".env.e2e" });

import { SlackClient } from "../slack/SlackClient";
import { sendPaymentWarning } from "../slack/sendPaymentWarning";
import { sendServicePausedMessage } from "../slack/sendServicePausedMessage";

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

const slackChannelId = getEnvVar("SLACK_CHANNEL_ID");
const slackAccessToken = getEnvVar("SLACK_ACCESS_TOKEN");

const slackClient = new SlackClient(slackChannelId, slackAccessToken);
const MOCK_ORG_ID = 12345;
const MOCK_FRONTEND_URL = "https://app.example.com";

async function main() {
  console.log("🔍 Testing billing status Slack messages...\n");

  console.log("📤 Sending payment warning (7 days remaining)...");
  const warning7 = await sendPaymentWarning(
    slackClient,
    MOCK_ORG_ID,
    MOCK_FRONTEND_URL,
    7,
  );
  console.log(warning7 ? "   ✅ Sent" : "   ❌ Failed");

  console.log("📤 Sending payment warning (1 day remaining)...");
  const warning1 = await sendPaymentWarning(
    slackClient,
    MOCK_ORG_ID,
    MOCK_FRONTEND_URL,
    1,
  );
  console.log(warning1 ? "   ✅ Sent" : "   ❌ Failed");

  console.log("📤 Sending service paused message...");
  const paused = await sendServicePausedMessage(
    slackClient,
    MOCK_ORG_ID,
    MOCK_FRONTEND_URL,
  );
  console.log(paused ? "   ✅ Sent" : "   ❌ Failed");

  console.log("\n✨ Done! Check your Slack channel.");
}

main().catch(console.error);
