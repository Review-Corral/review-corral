import { WebClient } from "@slack/web-api";
import { SupabaseClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";
import { NextApiResponse } from "next";
import { withAxiom } from "next-axiom";
import { AxiomAPIRequest } from "next-axiom/dist/withAxiom";
import { GithubEventHandler } from "../../../../components/api/gh/events/GithubEventHandler";
import { flattenType } from "../../../../components/api/utils/apiUtils";
import { analytics } from "../../../../components/api/utils/segment";
import withApiSupabase from "../../../../components/api/utils/withApiSupabase";
import { Organization } from "../../../../components/organization/shared";
import { GithubEvent } from "../../../../github-event-types";

const handler = async (
  req: AxiomAPIRequest,
  res: NextApiResponse,
  supabaseClient: SupabaseClient,
): Promise<void> => {
  req.log.debug("Got request to POST /api/gh/events");
  console.log("Got request to POST /api/gh/events");

  const validEvent = await checkEventWrapper(req);

  if (!validEvent) {
    req.log.error("Got event with invalid signature");
    console.error("Got event with invalid signature");
    req.log.flush();
    return res.status(403).send({ error: "Invalid signature" });
  }

  req.log.debug("Event has valid signature");

  const body = req.body as GithubEvent;

  req.log.info("Got Github Event", {
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

    const { data: githubRepository, error } = await supabaseClient
      .from("github_repositories")
      .select(
        `
        id,
        organization:organizations (*)
      `,
      )
      .eq("repository_id", Number(body?.repository.id))
      .limit(1)
      .single();

    const organization = flattenType<Organization>(
      githubRepository?.organization,
    );

    if (error) {
      req.log.info("Error finding Github Repository: ", error);
      return res.status(500).send({ error: "Error finding Github Repository" });
    }

    if (!organization) {
      req.log.warn("No organization found for repository_id: ", {
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
      req.log.warn("Error finding Slack Integration: ", slackIntegrationError);
      return res.status(404).send({ error: "No organization found" });
    }

    // Flush the events now so we're guranteed to get at least something in the logs
    // in the event that the logs are too big to fully send later one
    await req.log.flush();

    const eventHandler = new GithubEventHandler(
      supabaseClient,
      slackClient,
      slackIntegration.channel_id,
      slackIntegration.access_token,
      organization.installation_id,
      req.log,
      organization.id,
    );

    try {
      await eventHandler.handleEvent(body);
    } catch (error) {
      req.log.error(`Got error handling event`, error);
      return res.status(400).send({ error: "Error handling event" });
    }
  }

  return res.status(200).send({ data: "OK" });
};

const checkEventWrapper = async (req: AxiomAPIRequest) => {
  if (!process.env.GITHUB_WEBHOOK_SECRET) {
    req.log.error("No GITHUB_WEBHOOK_SECRET set");
    return false;
  }
  try {
    const signature = req.headers["x-hub-signature-256"];

    if (!signature) {
      req.log.debug("No signature found");
      return false;
    }

    if (Array.isArray(signature)) {
      req.log.debug("Signature is invalid type");
      return false;
    }

    // TODO: REMOVE
    req.log.debug("Signature: ", { signature });
    console.log("Signature: ", { signature });

    return await verifyGithubWebhookSecret({
      signature,
      secret: process.env.GITHUB_WEBHOOK_SECRET,
    });
  } catch (error) {
    console.error("Error checking event", error);
    return false;
  }
};

const verifyGithubWebhookSecret = async ({
  signature,
  secret,
}: {
  signature: string;
  secret: string;
}) => {
  const hmac = createHmac("sha256", secret);
  const calculated = `sha256=${hmac.digest("hex")}`;

  return calculated === signature;
};

export default withAxiom(withApiSupabase(handler));
