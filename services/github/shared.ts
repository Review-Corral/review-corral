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
