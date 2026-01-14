/**
 * Script to post a demo PR reminder message to Slack for testing.
 *
 * Run with: bun packages/domain/scripts/post-pr-reminder.ts
 */
require("dotenv").config({ path: ".env.e2e" });

import type { PrReminder } from "../postgres/fetchers/pr-reminders";
import { SlackClient } from "../slack/SlackClient";
import { buildPrReminderMessage } from "../slack/prReminderMessage";

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

// Avatar URLs for demo users
const avatars = {
  jim: "https://cdn.mos.cms.futurecdn.net/ojTtHYLoiqG2riWm7fB9Gn.jpg",
  michael:
    "https://static1.srcdn.com/wordpress/wp-content/uploads/2023/01/steve-carell-as-michael-scott-with-the-cast-of-the-office.jpg",
  dwight:
    "https://www.myany.city/sites/default/files/styles/scaled_cropped_medium__260x260/public/field/image/node-related-images/sample-dwight-k-schrute.jpg",
  org: "https://logos-world.net/wp-content/uploads/2022/02/Dunder-Mifflin-Logo.png",
};

// Mock PR data for testing
// Use a real threadTs if you want to test linking to an existing message
const mockPrs: PrReminder[] = [
  {
    prNumber: 340,
    prId: 123,
    repoName: "sales-portal",
    threadTs: "1234567890.123456", // Example threadTs - replace with real one to test
    approvalCount: 1,
    requiredApprovals: 2,
    requestedReviewers: ["dwight", "michael"],
    additions: 432,
    deletions: 12,
    authorLogin: "jim",
    authorAvatarUrl: avatars.jim,
    targetBranch: "main",
    orgName: "dunder-mifflin",
    orgAvatarUrl: avatars.org,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  },
  {
    prNumber: 341,
    prId: 456,
    repoName: "sales-portal",
    threadTs: null, // No thread - won't be linked
    approvalCount: 0,
    requiredApprovals: 2,
    requestedReviewers: ["jim"],
    additions: null, // No diff data - won't show +/-
    deletions: null,
    authorLogin: "michael",
    authorAvatarUrl: avatars.michael,
    targetBranch: "develop",
    orgName: "dunder-mifflin",
    orgAvatarUrl: avatars.org,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    prNumber: 42,
    prId: 789,
    repoName: "hr-system",
    threadTs: "1234567890.654321", // Example threadTs
    approvalCount: 1,
    requiredApprovals: 3,
    requestedReviewers: ["toby"],
    additions: 100,
    deletions: 25,
    authorLogin: "dwight",
    authorAvatarUrl: avatars.dwight,
    targetBranch: "main",
    orgName: "dunder-mifflin",
    orgAvatarUrl: avatars.org,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
  },
];

async function main() {
  console.log("Posting demo PR reminder message to Slack...\n");

  const message = buildPrReminderMessage(mockPrs, slackChannelId);

  console.log("Message text:", message.text);
  console.log("Blocks:", JSON.stringify(message.blocks, null, 2));
  console.log("Attachments:", JSON.stringify(message.attachments, null, 2));
  console.log();

  const result = await slackClient.postMessage({
    message: {
      text: message.text,
      blocks: message.blocks,
      attachments: message.attachments,
    },
    threadTs: undefined,
  });

  if (result) {
    console.log(`Posted! Message ts: ${result.ts}`);
  } else {
    console.error("Failed to post message");
  }
}

main().catch(console.error);
