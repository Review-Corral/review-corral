import ky from "ky";
import { ApiHandler } from "sst/node/api";
import * as z from "zod";
import { Logger } from "../../../core/logging";
import { insertSlackIntegration } from "../../../core/slack/fetchers";
import { assertVarExists } from "../../../core/utils/assert";

const LOGGER = new Logger("slack:oauth");

const slackAuthRequestSchema = z.object({
  code: z.string(),
  state: z.string(), // should be Organization ID
});

const slackAuthResponseBodySchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  scope: z.string(),
  bot_user_id: z.string(),
  app_id: z.string(),
  team: z.object({
    id: z.string(),
    name: z.string(),
  }),
  enterprise: z.object({
    id: z.string(),
    name: z.string(),
  }),
  authed_user: z.object({
    id: z.string(),
    scope: z.string(),
    access_token: z.string(),
    token_type: z.string(),
  }),
  incoming_webhook: z.object({
    channel: z.string(),
    channel_id: z.string(),
    configuration_url: z.string(),
    url: z.string(),
  }),
});

export const handler = ApiHandler(async (event, context) => {
  const searchParams = slackAuthRequestSchema.parse(
    event.queryStringParameters
  );

  const slackResponse = await ky.post("https://slack.com/api/oauth.v2.access", {
    body: JSON.stringify({
      client_id: process.env.NEXT_PUBLIC_SLACK_BOT_ID,
      code: searchParams.code,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      redirect_uri: assertVarExists("SLACK_AUTH_URL"),
    }),
  });

  if (slackResponse.status !== 200 && slackResponse.status !== 201) {
    LOGGER.warn("Slack oauth failed", { slackResponse });

    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Slack oauth failed" }),
    };
  }

  LOGGER.info("Slack oauth successful", { slackResponse });

  const parsedBody = slackAuthResponseBodySchema.parse(
    await slackResponse.json()
  );

  const { access_token, ...parsedBodyLessToken } = parsedBody;

  LOGGER.debug("Slack response body (less token)", { parsedBodyLessToken });

  await insertSlackIntegration({
    accessToken: parsedBody.access_token,
    channelId: parsedBody.incoming_webhook.channel_id,
    channelName: parsedBody.incoming_webhook.channel,
    slackTeamName: parsedBody.team.name,
    slackTeamId: parsedBody.team.id,
    organizationId: Number(searchParams.state),
  });

  return {
    statusCode: 201,
  };
});
