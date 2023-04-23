import { Db } from "services/db";
import { SlackClient } from "services/slack/SlackClient";

export interface BaseGithubHanderProps {
  database: Db;
  slackClient: SlackClient;
  organizationId: string;
  installationId: number;
}

export async function getSlackUserName(
  githubLogin: string,
  props: Pick<BaseGithubHanderProps, "database" | "organizationId">,
): Promise<string> {
  const { data: slackUserId, error } =
    await props.database.getSlackUserIdFromGithubLogin({
      githubLogin,
      organizationId: props.organizationId,
    });

  if (error) {
    console.warn("Error getting slack user name: ", error);
    return githubLogin;
  }

  if (slackUserId) {
    return `<@${slackUserId.slack_user_id}>`;
  }

  return githubLogin;
}

export async function getThreadTs(
  prId: number,
  database: Db,
): Promise<string | undefined> {
  const { data, error } = await database.getPullRequest({
    prId: prId.toString(),
  });

  if (error) {
    console.debug("Error getting threadTs: ", error);
  }

  console.debug("Found threadTS: ", { threadTs: data?.thread_ts });

  return data?.thread_ts ?? undefined;
}
