/* eslint-disable no-console */
import { WebClient } from "@slack/web-api";
import { SupabaseClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";
import { NextApiRequest, NextApiResponse } from "next";
import { AxiomAPIRequest, withAxiom } from "next-axiom/dist/withAxiom";
import { GithubEventHandler } from "../../../../components/api/gh/events/GithubEventHandler";
import { flattenType } from "../../../../components/api/utils/apiUtils";
import { analytics } from "../../../../components/api/utils/segment";
import withApiSupabase from "../../../../components/api/utils/withApiSupabase";
import { Organization } from "../../../../components/organization/shared";
import { GithubEvent } from "../../../../types/github-event-types";

const handler = async (
  req: AxiomAPIRequest,
  res: NextApiResponse,
  supabaseClient: SupabaseClient,
): Promise<void> => {
  console.log("Got request to POST /api/gh/events");

  const validEvent = await checkEventWrapper(req);

  if (!validEvent) {
    console.error("Got event with invalid signature");
    return res.status(403).send({ error: "Invalid signature" });
  }

  console.debug("Event has valid signature");
  console.log("Event has valid signature");

  const body = req.body as GithubEvent;

  console.info("Got Github Event", {
    action: body?.action,
    number: body?.number,
    pullRequestId: body.pull_request?.id,
  });

  analytics.track({
    event: "Got GH Event",
    userId: body?.sender?.login ?? "unknown",
    properties: {
      body: body,
      env: process.env.NODE_ENV ?? "development",
    },
  });

  if (body?.pull_request && body?.pull_request.id && body?.repository.id) {
    const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

    const repositoryId: Number = Number(body.repository.id);

    const { data: githubRepository, error } = await supabaseClient
      .from("github_repositories")
      .select(
        `
        id,
        organization:organizations (*)
      `,
      )
      .eq("repository_id", repositoryId)
      .single();

    if (error) {
      console.error(`Error finding Github Repository with id: `, {
        pull_request_id: body.pull_request.id,
        repositoryId,
        error,
      });
      return res.status(500).send({ error: "Error finding Github Repository" });
    }

    const organization = flattenType<Organization>(
      githubRepository?.organization,
    );

    if (!organization) {
      console.warn("No organization found for repository_id: ", {
        orgId: body.repository.id,
      });
      return res.status(404).send({ error: "No organization found" });
    }

    const { data: slackIntegration, error: slackIntegrationError } =
      await supabaseClient
        .from("slack_integration")
        .select("*")
        .eq("organization_id", organization.id)
        .limit(1)
        .single();

    if (slackIntegrationError) {
      console.warn("Error finding Slack Integration: ", slackIntegrationError);
      return res.status(404).send({ error: "No organization found" });
    }

    const eventHandler = new GithubEventHandler(
      supabaseClient,
      slackClient,
      slackIntegration.channel_id,
      slackIntegration.access_token,
      organization.installation_id,
      organization.id,
    );

    try {
      await eventHandler.handleEvent(body);
    } catch (error) {
      console.error(`Got error handling event`, error);
      return res.status(400).send({ error: "Error handling event" });
    }
  }

  return res.status(200).send({ data: "OK" });
};

const checkEventWrapper = async (req: NextApiRequest) => {
  if (!process.env.GITHUB_WEBHOOK_SECRET) {
    console.error("No GITHUB_WEBHOOK_SECRET set");
    return false;
  }
  try {
    const signature = req.headers["x-hub-signature-256"];

    if (!signature) {
      console.debug("No signature found");
      return false;
    }

    if (Array.isArray(signature)) {
      console.debug("Signature is invalid type");
      return false;
    }

    return await verifyGithubWebhookSecret({
      req,
      signature,
      secret: process.env.GITHUB_WEBHOOK_SECRET,
    });
  } catch (error) {
    console.error("Error checking event", error);
    return false;
  }
};

const verifyGithubWebhookSecret = async ({
  req,
  signature,
  secret,
}: {
  req: NextApiRequest;
  signature: string;
  secret: string;
}) => {
  const hmac = createHmac("sha256", secret);
  hmac.update(JSON.stringify(req.body));
  const calculated = `sha256=${hmac.digest("hex")}`;

  return calculated === signature;
};

// TOOD: remove when transition away from Axiom complete
export default withAxiom(withApiSupabase(handler));
