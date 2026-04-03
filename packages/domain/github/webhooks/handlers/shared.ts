import { insertSlackCommentDmMapping } from "../../../postgres/fetchers/slack-comment-dm-mappings";
import { getOrgMemberByUsername } from "../../../postgres/fetchers/members";
import { SlackCommentDmTargetType } from "../../../postgres/schema/slack-comment-dm-mappings";
import { SlackClient } from "../../../slack/SlackClient";
import { BaseGithubWebhookEventHanderArgs } from "../types";

// Re-export attachment functions from their dedicated module
export {
  getDmAttachment,
  getReviewRequestDmAttachment,
} from "../../../slack/dmAttachments";

export async function getSlackUserName(
  githubLogin: string,
  props: Pick<BaseGithubWebhookEventHanderArgs, "organizationId">,
): Promise<string> {
  const slackId = await getSlackUserId(githubLogin, props);

  if (slackId) {
    return `<@${slackId}>`;
  }

  return githubLogin;
}

/**
 * Gets just the Slack user ID (not the mention format) for a GitHub username.
 * Returns null if the user is not found or has no Slack ID.
 */
export async function getSlackUserId(
  githubLogin: string,
  props: Pick<BaseGithubWebhookEventHanderArgs, "organizationId">,
): Promise<string | null> {
  const member = await getOrgMemberByUsername({
    orgId: props.organizationId,
    githubUsername: githubLogin,
  });

  return member?.slackId ?? null;
}

export async function persistCommentDmMapping({
  dmResult,
  args,
  targetType,
  repositoryFullName,
  githubCommentId,
  commentAuthorGithubUsername,
  commentBody,
  prTitle,
  prNumber,
  commentUrl,
}: {
  dmResult: Awaited<ReturnType<SlackClient["postDirectMessage"]>>;
  args: Pick<BaseGithubWebhookEventHanderArgs, "organizationId" | "slackTeamId">;
  targetType: SlackCommentDmTargetType;
  repositoryFullName: string;
  githubCommentId: number;
  commentAuthorGithubUsername: string;
  commentBody: string | null | undefined;
  prTitle: string;
  prNumber: number;
  commentUrl: string;
}): Promise<void> {
  const channel = dmResult?.channel;
  const ts = dmResult?.ts;

  if (!channel || !ts || !args.slackTeamId) {
    return;
  }

  const [owner, repo] = repositoryFullName.split("/");
  if (!owner || !repo) {
    return;
  }

  await insertSlackCommentDmMapping({
    slackChannelId: channel,
    slackMessageTs: ts,
    orgId: args.organizationId,
    slackTeamId: args.slackTeamId,
    targetType,
    owner,
    repo,
    githubCommentId,
    commentAuthorGithubUsername,
    commentBody: commentBody ?? null,
    prTitle,
    prNumber,
    commentUrl,
  });
}

/**
 * Extracts GitHub username mentions (@username) from a comment body
 */
export function extractMentions(commentBody: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
  const mentions: string[] = [];
  let match: RegExpExecArray | null = null;

  while ((match = mentionRegex.exec(commentBody)) !== null) {
    mentions.push(match[1]);
  }

  return mentions;
}
