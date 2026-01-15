import { insertDmMessageLink } from "@domain/postgres/fetchers/dm-message-links";
import { type CommentType } from "@domain/postgres/schema";
import { ChatPostMessageResponse } from "@slack/web-api";
import { Logger } from "../logging";

const LOGGER = new Logger("slack.dmTracking");

export type DmTrackingContext = {
  githubCommentId: number;
  commentType: CommentType;
  repoOwner: string;
  repoName: string;
  orgId: number;
};

/**
 * Stores the link between a Slack DM and a GitHub comment for reaction sync.
 * Call this after successfully sending a DM about a comment.
 */
export async function trackDmForReactions(
  response: ChatPostMessageResponse,
  context: DmTrackingContext,
): Promise<void> {
  if (!response.ts || !response.channel) {
    LOGGER.warn("DM response missing ts or channel, cannot track", {
      hasTs: !!response.ts,
      hasChannel: !!response.channel,
    });
    return;
  }

  try {
    await insertDmMessageLink({
      slackChannelId: response.channel,
      slackMessageTs: response.ts,
      githubCommentId: context.githubCommentId,
      commentType: context.commentType,
      repoOwner: context.repoOwner,
      repoName: context.repoName,
      orgId: context.orgId,
    });

    LOGGER.debug("Tracked DM for reaction sync", {
      slackMessageTs: response.ts,
      githubCommentId: context.githubCommentId,
      commentType: context.commentType,
    });
  } catch (error) {
    // Log but don't fail the DM send - tracking is best-effort
    LOGGER.error("Failed to track DM for reaction sync", { error });
  }
}
