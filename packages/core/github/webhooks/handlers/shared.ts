import { fetchPullRequestById } from "../../../db/fetchers/pullRequests";
import { getSlackUseridFromGithubLogin } from "../../../db/fetchers/usernameMappings";
import { BaseGithubWebhookEventHanderArgs } from "../types";

export async function getSlackUserName(
  githubLogin: string,
  props: Pick<BaseGithubWebhookEventHanderArgs, "organizationId">
): Promise<string> {
  const usernameMappings = await getSlackUseridFromGithubLogin({
    githubLogin,
    organizationId: props.organizationId,
  });

  if (usernameMappings) {
    return usernameMappings.slackUserId;
  }

  return githubLogin;
}

export async function getThreadTs(prId: number): Promise<string | undefined> {
  const pullRequest = await fetchPullRequestById(prId);

  return pullRequest?.threadTs ?? undefined;
}
