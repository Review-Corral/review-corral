import { getOrgMember } from "../../../dynamodb/fetchers/members";
import { BaseGithubWebhookEventHanderArgs } from "../types";

export async function getSlackUserName(
  githubLogin: string,
  props: Pick<BaseGithubWebhookEventHanderArgs, "organizationId">,
): Promise<string> {
  const usernameMap = await getOrgMember({
    orgId: props.organizationId,
    githubUsername: githubLogin,
  });

  if (usernameMap?.slackId) {
    return `<@${usernameMap.slackId}>`;
  }

  return githubLogin;
}
