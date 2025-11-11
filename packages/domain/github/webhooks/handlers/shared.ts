import { getOrgMemberByUsername } from "../../../postgres/fetchers/members";
import { BaseGithubWebhookEventHanderArgs } from "../types";

export async function getSlackUserName(
  githubLogin: string,
  props: Pick<BaseGithubWebhookEventHanderArgs, "organizationId">,
): Promise<string> {
  const member = await getOrgMemberByUsername({
    orgId: props.organizationId,
    githubUsername: githubLogin,
  });

  if (member?.slackId) {
    return `<@${member.slackId}>`;
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
