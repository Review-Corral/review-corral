import { getOrgMemberByUsername } from "../../../postgres/fetchers/members";
import { BaseGithubWebhookEventHanderArgs } from "../types";

// Re-export attachment functions from their dedicated module
export { getDmAttachment, getReviewRequestDmAttachment } from "../../../slack/dmAttachments";

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
