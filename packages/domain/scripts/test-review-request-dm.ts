/**
 * Script to test sending a review request DM to Jim.
 *
 * Run with: bun packages/domain/scripts/test-review-request-dm.ts
 */
require("dotenv").config({ path: ".env.e2e" });

import { WebClient } from "@slack/web-api";
import { getReviewRequestDmAttachment } from "../slack/dmAttachments";

const slackAccessToken = process.env.SLACK_ACCESS_TOKEN;
if (!slackAccessToken) {
  throw new Error("SLACK_ACCESS_TOKEN is not set");
}

const client = new WebClient(slackAccessToken);

// Slack user IDs
const slackUserIds = {
  michael: "U081WKT1AUQ",
  jim: "U07GB8TBX53",
  dwight: "U07J1FWJUQ0",
};

// User data
const users = {
  dwight: {
    login: "dwight",
    avatar_url:
      "https://www.myany.city/sites/default/files/styles/scaled_cropped_medium__260x260/public/field/image/node-related-images/sample-dwight-k-schrute.jpg",
  },
};

async function main() {
  console.log("Sending review request DM to Jim...\n");

  const pr = {
    title: "Add beet farming integration",
    number: 342,
    html_url: "https://github.com/dunder-mifflin/app/pull/342",
    body: "Integrates Schrute Farms beet inventory with the main system.\n\n## Changes\n- Added beet API client\n- Updated inventory service",
    additions: 156,
    deletions: 23,
    base: { ref: "main" },
    user: { avatar_url: users.dwight.avatar_url },
  };

  const repository = {
    full_name: "dunder-mifflin/app",
    owner: {
      avatar_url:
        "https://logos-world.net/wp-content/uploads/2022/02/Dunder-Mifflin-Logo.png",
    },
  };

  // Open DM conversation with Jim
  const dmChannel = await client.conversations.open({
    users: slackUserIds.jim,
  });

  if (!dmChannel.channel?.id) {
    console.error("Failed to open DM channel");
    return;
  }

  const response = await client.chat.postMessage({
    channel: dmChannel.channel.id,
    text: "🔍 You've been requested to review",
    attachments: [
      getReviewRequestDmAttachment(
        pr,
        repository,
        `<@${slackUserIds.dwight}>`,
        "blue",
      ),
    ],
  });

  if (response.ok) {
    console.log("DM sent successfully!");
    console.log(`  Channel: ${response.channel}`);
    console.log(`  Message TS: ${response.ts}`);
  } else {
    console.log("Failed to send DM:", response.error);
  }
}

main().catch(console.error);
