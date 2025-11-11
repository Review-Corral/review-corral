import { assertVarExists } from "@core/utils/assert";
import { Logger } from "@domain/logging";
import { getOrganization } from "@domain/postgres/fetchers/organizations";
import {
  deleteSlackIntegration,
  getSlackInstallationUsers,
  getSlackInstallationsForOrganization,
  insertSlackIntegration,
  updateSlackIntegrationScopes,
} from "@domain/postgres/fetchers/slack-integrations";
import { areScopesOutdated } from "@domain/slack/checkScopesOutdated";
import { Hono } from "hono";
import ky from "ky";
import { Resource } from "sst";
import * as z from "zod";
import { authMiddleware, requireAuth } from "../middleware/auth";

const LOGGER = new Logger("slack:routes");

export const app = new Hono();

// Schema definitions
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
  // NOTE: this is deprecated--we now get perms for all channels
  // so channel selecting here is not needed
  incoming_webhook: z
    .object({
      channel: z.string(),
      channel_id: z.string(),
      configuration_url: z.string(),
      url: z.string(),
    })
    .optional(),
});

const slackAuthResponseFailedSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
});

const slackAuthResponseBodySchema = z.union([
  slackAuthResponseBodyOKSchema,
  slackAuthResponseFailedSchema,
]);

const orgIdSchema = z.object({
  organizationId: z.string().transform(Number),
});

const deleteIntegrationSchema = z.object({
  slackTeamId: z.string(),
});

// OAuth route - no auth required
app.get("/oauth", async (c) => {
  const query = c.req.query();
  LOGGER.debug("Received query params", { queryParams: query });

  try {
    const searchParams = slackAuthRequestSchema.parse(query);

    const formData = new FormData();
    formData.append("client_id", Resource.SLACK_BOT_ID.value);
    formData.append("code", searchParams.code);
    formData.append("client_secret", Resource.SLACK_CLIENT_SECRET.value);
    formData.append("redirect_uri", `${assertVarExists("BASE_API_URL")}/slack/oauth`);

    const orgId = Number(searchParams.state);

    LOGGER.debug("Received Slack oAuth request", { orgId });

    const slackResponse = await ky.post("https://slack.com/api/oauth.v2.access", {
      body: formData,
    });

    if (slackResponse.status !== 200 && slackResponse.status !== 201) {
      LOGGER.warn("Slack oauth failed", { slackResponse });
      return c.json({ message: "Slack oauth failed" }, 400);
    }

    LOGGER.info("Slack oauth successful", { slackResponse });
    const responseBody = await slackResponse.json();
    LOGGER.debug("Slack response body", { responseBody });
    const parsedBody = slackAuthResponseBodySchema.parse(responseBody);

    if (!parsedBody.ok) {
      LOGGER.warn("Slack oauth failed", { parsedBody });
      return c.json({ message: "Slack oauth failed" }, 400);
    } else {
      const { access_token, scope, ...parsedBodyLessToken } = parsedBody;

      LOGGER.debug("Slack response body (less token)", { parsedBodyLessToken });

      // Check if an integration already exists for this org and team
      const existingIntegrations = await getSlackInstallationsForOrganization(orgId);
      const existingIntegration = existingIntegrations.find(
        (i) => i.slackTeamId === parsedBody.team.id,
      );

      if (existingIntegration) {
        // Update existing integration with new scopes
        await updateSlackIntegrationScopes(existingIntegration.id, scope);

        LOGGER.info("Slack integration scopes updated during oauth", {
          orgId,
          slackTeamId: parsedBody.team.id,
          scopes: scope,
        });
      } else {
        // Create new integration
        await insertSlackIntegration({
          accessToken: parsedBody.access_token,
          channelId: "TEMP: Deprecated",
          channelName: "TEMP: Deprecated",
          slackTeamName: parsedBody.team.name,
          slackTeamId: parsedBody.team.id,
          orgId,
          scopes: scope,
        });

        LOGGER.info("Slack integration created during oauth", {
          orgId,
          slackTeamId: parsedBody.team.id,
          scopes: scope,
        });
      }

      // Redirect response
      return c.redirect(`${assertVarExists("BASE_FE_URL")}`, 302);
    }
  } catch (error) {
    LOGGER.error("Error in Slack OAuth", { error });
    return c.json({ message: "Error in Slack OAuth" }, 400);
  }
});

// Create a group for protected routes
const protectedRoutes = new Hono();

// Apply authentication middleware to all protected routes
protectedRoutes.use("*", authMiddleware, requireAuth);

// Get users route
protectedRoutes.get("/:organizationId/users", async (c) => {
  try {
    const { organizationId } = orgIdSchema.parse(c.req.param());

    const organization = await getOrganization(organizationId);

    if (!organization) {
      return c.json({ message: "Organization not found" }, 404);
    }

    const slackIntegration = await getSlackInstallationsForOrganization(organizationId);

    if (slackIntegration.length === 0) {
      return c.json(
        {
          message: `No Slack installations found for org Id ${organizationId}`,
        },
        404,
      );
    }

    LOGGER.info("Got Slack Integration for organization", {
      organizationId,
      returnedSlackIntegrations: slackIntegration.length,
      slackIntegration: {
        ...slackIntegration[0],
        accessToken: "REDACTED",
      },
    });

    const users = await getSlackInstallationUsers(slackIntegration[0]);
    return c.json(users);
  } catch (error) {
    LOGGER.error("Error getting Slack users", { error });
    return c.json({ message: "Error getting Slack users" }, 500);
  }
});

// Get installations route
protectedRoutes.get("/:organizationId/installations", async (c) => {
  try {
    const { organizationId } = orgIdSchema.parse(c.req.param());

    const organization = await getOrganization(organizationId);

    if (!organization) {
      return c.json({ message: "Organization not found" }, 404);
    }

    const slackIntegration = await getSlackInstallationsForOrganization(organizationId);

    // Add scopesAreOutdated field to each integration
    const integrationsWithStatus = slackIntegration.map((integration) => ({
      ...integration,
      scopesAreOutdated: areScopesOutdated(integration),
    }));

    return c.json(integrationsWithStatus);
  } catch (error) {
    LOGGER.error("Error getting Slack installations", { error });
    return c.json({ message: "Error getting Slack installations" }, 500);
  }
});

// Delete integration route
protectedRoutes.delete("/:organizationId/installations", async (c) => {
  const user = c.get("user");

  LOGGER.info("Got request to delete Slack integration", {
    user,
  });

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const { organizationId: orgId } = orgIdSchema.parse(c.req.param());
    const body = await c.req.json();
    const { slackTeamId } = deleteIntegrationSchema.parse(body);

    const organization = await getOrganization(orgId);

    if (!organization) {
      return c.json({ message: "Organization not found" }, 404);
    }

    await deleteSlackIntegration({
      orgId,
      slackTeamId,
    });

    LOGGER.info("Slack integration deleted", {
      orgId,
      slackTeamId,
    });

    return c.json({ message: "Slack integration deleted" });
  } catch (error) {
    LOGGER.error("Error deleting Slack integration", { error });
    return c.json({ message: "Error deleting Slack integration" }, 500);
  }
});

// Merge the protected routes into main app
app.route("/", protectedRoutes);
