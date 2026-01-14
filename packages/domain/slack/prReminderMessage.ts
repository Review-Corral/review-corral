import type { KnownBlock, MessageAttachment } from "@slack/web-api";
import type { PrReminder } from "../postgres/fetchers/pr-reminders";

/**
 * Builds a Slack Block Kit message for outstanding PR reminders.
 * Each PR is a separate attachment with a link to the original PR thread.
 */
export function buildPrReminderMessage(
  prs: PrReminder[],
  channelId: string,
): {
  text: string;
  blocks: KnownBlock[];
  attachments: MessageAttachment[];
} {
  const prCount = prs.length;
  const text = `${prCount} PR${prCount === 1 ? "" : "s"} awaiting review`;

  const blocks: KnownBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `:bell: ${text}`,
        emoji: true,
      },
    },
  ];

  // Sort PRs by createdAt (oldest first)
  const sortedPrs = [...prs].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );

  // Build an attachment for each PR
  const attachments: MessageAttachment[] = sortedPrs.map((pr) => {
    const age = getHumanReadableAge(pr.createdAt);

    // Build the PR title with optional link to original thread
    let prTitle = `*${pr.repoName}* #${pr.prNumber}`;
    if (pr.threadTs) {
      const threadLink = buildSlackThreadLink(channelId, pr.threadTs);
      prTitle = `<${threadLink}|*${pr.repoName}* #${pr.prNumber}>`;
    }

    // Build context elements matching the main PR message format
    const contextElements: object[] = [];

    // Org avatar + repo name (like repository.full_name)
    contextElements.push({
      type: "image",
      image_url: pr.orgAvatarUrl,
      alt_text: "repo owner",
    });
    contextElements.push({
      type: "mrkdwn",
      text: `${pr.orgName}/${pr.repoName}`,
    });

    // Author avatar + login (without @mention)
    if (pr.authorAvatarUrl && pr.authorLogin) {
      contextElements.push({
        type: "image",
        image_url: pr.authorAvatarUrl,
        alt_text: "author",
      });
      contextElements.push({
        type: "mrkdwn",
        text: pr.authorLogin,
      });
    }

    // Diff counts
    if (pr.additions !== null && pr.deletions !== null) {
      contextElements.push({
        type: "image",
        image_url: "https://cdn-icons-png.flaticon.com/512/9296/9296948.png",
        alt_text: "plus-minus-icon",
      });
      contextElements.push({
        type: "mrkdwn",
        text: `+${pr.additions}-${pr.deletions}`,
      });
    }

    // Target branch
    if (pr.targetBranch) {
      contextElements.push({
        type: "mrkdwn",
        text: `:dart: ${pr.targetBranch}`,
      });
    }

    // Age (additional info not in main message)
    contextElements.push({
      type: "mrkdwn",
      text: `:clock1: ${age}`,
    });

    return {
      color: "#35373B",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: prTitle,
          },
        },
        {
          type: "context",
          elements: contextElements,
        },
      ],
    };
  });

  return { text, blocks, attachments };
}

/**
 * Builds a Slack deep link to a specific message thread.
 * Format: https://slack.com/archives/CHANNEL_ID/pTHREAD_TS
 * The thread_ts needs dots removed and 'p' prefix added.
 */
function buildSlackThreadLink(channelId: string, threadTs: string): string {
  const tsWithoutDot = threadTs.replace(".", "");
  return `https://slack.com/archives/${channelId}/p${tsWithoutDot}`;
}

/**
 * Converts a timestamp to a human-readable age string (e.g., "5h", "2d")
 */
function getHumanReadableAge(createdAt: Date): string {
  const hoursAgo = Math.floor(
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60),
  );

  if (hoursAgo < 24) {
    return `${hoursAgo}h`;
  }

  const daysAgo = Math.floor(hoursAgo / 24);
  return `${daysAgo}d`;
}
