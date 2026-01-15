import { createGitHubReaction } from "@domain/github/fetchers";
import { findDmMessageLink } from "@domain/postgres/fetchers/dm-message-links";
import { getGitHubTokenBySlackId } from "@domain/postgres/fetchers/members";
import { Logger } from "../../logging";
import { mapSlackEmojiToGitHub } from "../reactions/emojiMapping";

const LOGGER = new Logger("slack.reactionHandler");

/**
 * Slack reaction_added event payload
 */
export interface SlackReactionEvent {
  type: "reaction_added";
  user: string;
  reaction: string;
  item: {
    type: string;
    channel: string;
    ts: string;
  };
  item_user: string;
  event_ts: string;
}

/**
 * Handles a Slack reaction_added event.
 * If the reaction is on a tracked DM message, syncs it to the corresponding
 * GitHub comment.
 */
export async function handleReactionEvent(event: SlackReactionEvent): Promise<void> {
  LOGGER.debug("Handling reaction event", { event });

  // Only handle reactions on messages
  if (event.item.type !== "message") {
    LOGGER.debug("Ignoring reaction on non-message item", {
      itemType: event.item.type,
    });
    return;
  }

  // Look up the DM message link
  const dmLink = await findDmMessageLink({
    slackChannelId: event.item.channel,
    slackMessageTs: event.item.ts,
  });

  if (!dmLink) {
    // Not a tracked DM message - this is expected for most messages
    LOGGER.debug("No DM link found for message", {
      channel: event.item.channel,
      ts: event.item.ts,
    });
    return;
  }

  // Map the Slack emoji to a GitHub reaction
  const githubReaction = mapSlackEmojiToGitHub(event.reaction);

  if (!githubReaction) {
    // User chose an emoji we don't map - silently ignore
    LOGGER.debug("Unmapped Slack emoji", { reaction: event.reaction });
    return;
  }

  // Look up the user's GitHub access token
  const userAccessToken = await getGitHubTokenBySlackId({
    orgId: dmLink.orgId,
    slackId: event.user,
  });

  if (!userAccessToken) {
    // User hasn't authenticated with GitHub OAuth - silently skip
    LOGGER.debug("No GitHub token for user", {
      slackUserId: event.user,
      orgId: dmLink.orgId,
    });
    return;
  }

  LOGGER.info("Syncing reaction to GitHub", {
    slackEmoji: event.reaction,
    githubReaction,
    commentId: dmLink.githubCommentId,
    commentType: dmLink.commentType,
  });

  try {
    await createGitHubReaction({
      owner: dmLink.repoOwner,
      repo: dmLink.repoName,
      commentId: dmLink.githubCommentId,
      commentType: dmLink.commentType,
      reaction: githubReaction,
      userAccessToken,
    });

    LOGGER.info("Successfully synced reaction to GitHub", {
      commentId: dmLink.githubCommentId,
      reaction: githubReaction,
    });
  } catch (error) {
    // Log but don't throw - this is a background sync
    LOGGER.error("Failed to sync reaction to GitHub", {
      error,
      dmLink,
      reaction: githubReaction,
    });
  }
}
