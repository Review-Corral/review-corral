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
