import { LATEST_SLACK_SCOPES } from "@core/slack/const";

/**
 * Builds the Slack bot install URL to go to in order to upodate or install the bot
 */
export const getSlackInstallUrl = (organizationId: number) => {
  const slackBotId = import.meta.env.VITE_SLACK_BOT_ID;
  if (!slackBotId) {
    throw Error("VITE_SLACK_BOT_ID not set");
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    throw Error("VITE_API_URL not set");
  }

  const slackAuthUrl = `${apiUrl}/slack/oauth`;

  const searchParams = new URLSearchParams({
    state: organizationId.toString(),
    redirect_uri: slackAuthUrl,
    client_id: slackBotId,
    scope: LATEST_SLACK_SCOPES,
    user_scope: "",
  });

  return `https://slack.com/oauth/v2/authorize?${searchParams.toString()}`;
};
