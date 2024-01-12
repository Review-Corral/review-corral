import { fetchPullRequestById } from "../../../db/fetchers/pullRequests";
import { getSlackUseridFromGithubLogin } from "../../../db/fetchers/usernameMappings";
import { BaseGithubWebhookEventHanderArgs } from "../types";

export async function getSlackUserName(
  githubLogin: string,
  props: Pick<BaseGithubWebhookEventHanderArgs, "organizationId">
): Promise<string> {
  const usernameMap = await getSlackUseridFromGithubLogin({
    githubLogin,
    organizationId: props.organizationId,
  });

  if (usernameMap) {
    return `<@${usernameMap.slackUserId}>`;
  }

  return githubLogin;
}

export async function getThreadTs(prId: number): Promise<string | undefined> {
  const pullRequest = await fetchPullRequestById(prId);

  return pullRequest?.threadTs ?? undefined;
}
