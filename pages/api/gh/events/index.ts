/* eslint-disable no-console */
import { flattenParam } from "@/components/utils/flattenParam";
import { createEventHandler } from "@octokit/webhooks";
import { SupabaseClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";
import { NextApiRequest, NextApiResponse } from "next";
import { AxiomAPIRequest, withAxiom } from "next-axiom/dist/withAxiom";
import { githubEventWrapper } from "services/github/githubEventWrapper";
import { handlePullRequestEvent } from "services/github/handlePrEvent";
import { handlePullRequestCommentEvent } from "services/github/handlePrReviewCommentEvent";
import withApiSupabase from "../../../../services/utils/withApiSupabase";

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

  console.log("Event has valid signature");

  const eventHandler = createEventHandler({});
  eventHandler.on("pull_request", (event) => {
    githubEventWrapper({
      supabaseClient,
      githubEvent: event,
      res,
      handler: handlePullRequestEvent,
    });
  });
  eventHandler.on("pull_request_review_comment", (event) => {
    githubEventWrapper({
      supabaseClient,
      githubEvent: event,
      res,
      handler: handlePullRequestCommentEvent,
    });
  });

  const githubDelivery = flattenParam(req.headers["x-github-delivery"]);
  const githubEventName = flattenParam(req.headers["x-github-event"]);

  if (!githubDelivery || !githubEventName) {
    console.warn(
      "Got Github event with valid signature but missing headers: ",
      {
        githubDelivery,
        githubEventName,
      },
    );

    return res.status(400).send({ error: "Missing headers" });
  }

  try {
    eventHandler.receive({
      id: githubDelivery,
      // Typing seems broken here?
      name: githubEventName as any,
      payload: req.body,
    });
  } catch (error) {
    console.error("Error handling event", error);
    return res.status(500).send({ error: "Error handling event" });
  }
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
