import { getOrgMember } from "../../../dynamodb/fetchers/members";
import { fetchPullRequestById } from "../../../dynamodb/fetchers/pullRequests";
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

export async function getThreadTs({
  prId,
  repoId,
}: {
  prId: number;
  repoId: number;
}): Promise<string | undefined> {
  const pullRequest = await fetchPullRequestById({
    pullRequestId: prId,
    repoId,
  });

  return pullRequest?.threadTs ?? undefined;
}
