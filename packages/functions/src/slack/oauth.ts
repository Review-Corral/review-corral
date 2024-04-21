import { assertVarExists } from "@core/utils/assert";
import { insertSlackIntegration } from "@domain/dynamodb/fetchers/slack";
import { Logger } from "@domain/logging";
import ky from "ky";
import { ApiHandler } from "sst/node/api";
import * as z from "zod";

const LOGGER = new Logger("slack:oauth");

const slackAuthRequestSchema = z.object({
  code: z.string(),
  state: z.string(), // should be Organization ID
});

const slackAuthResponseBodyOKSchema = z.object({
  ok: z.literal(true),
  access_token: z.string(),
  token_type: z.string(),
  scope: z.string(),
  bot_user_id: z.string(),
  app_id: z.string(),
  team: z.object({
    id: z.string(),
    name: z.string(),
  }),
  enterprise: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
  authed_user: z.object({
    id: z.string(),
  }),
  incoming_webhook: z.object({
    channel: z.string(),
    channel_id: z.string(),
    configuration_url: z.string(),
    url: z.string(),
  }),
});

const slackAuthResponseFailedSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
});

const slackAuthResponseBodySchema = z.union([
  slackAuthResponseBodyOKSchema,
  slackAuthResponseFailedSchema,
]);

export const handler = ApiHandler(async (event, context) => {
  LOGGER.debug("Recieved query params", {
    queryParams: event.queryStringParameters,
  });

  const searchParams = slackAuthRequestSchema.parse(event.queryStringParameters);

  const formData = new FormData();
  formData.append("client_id", assertVarExists("VITE_SLACK_BOT_ID"));
  formData.append("code", searchParams.code);
  formData.append("client_secret", assertVarExists("VITE_SLACK_CLIENT_SECRET"));
  formData.append("redirect_uri", assertVarExists("VITE_SLACK_AUTH_URL"));

  const orgId = Number(searchParams.state);

  LOGGER.debug("Recieved Slack oAuth request", {
    orgId,
  });

  const slackResponse = await ky.post("https://slack.com/api/oauth.v2.access", {
    body: formData,
  });

  if (slackResponse.status !== 200 && slackResponse.status !== 201) {
    LOGGER.warn("Slack oauth failed", { slackResponse });

    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Slack oauth failed" }),
    };
  }

  LOGGER.info("Slack oauth successful", { slackResponse });
  const responseBody = await slackResponse.json();
  LOGGER.debug("Slack response body", { responseBody });
  const parsedBody = slackAuthResponseBodySchema.parse(responseBody);

  if (!parsedBody.ok) {
    LOGGER.warn("Slack oauth failed", { parsedBody });

    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Slack oauth failed" }),
    };
  } else {
    const { access_token, ...parsedBodyLessToken } = parsedBody;

    LOGGER.debug("Slack response body (less token)", { parsedBodyLessToken });

    await insertSlackIntegration({
      accessToken: parsedBody.access_token,
      channelId: parsedBody.incoming_webhook.channel_id,
      channelName: parsedBody.incoming_webhook.channel,
      slackTeamName: parsedBody.team.name,
      slackTeamId: parsedBody.team.id,
      orgId,
    });

    return {
      statusCode: 302,
      headers: {
        Location: `${assertVarExists("BASE_FE_URL")}`,
      },
    };
  }
});
