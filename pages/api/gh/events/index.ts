/* eslint-disable no-console */
import { flattenParam } from "@/components/utils/flattenParam";
import { EmitterWebhookEvent } from "@octokit/webhooks";
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

  const githubDelivery = flattenParam(req.headers["x-github-delivery"]);
  const githubEventName = flattenParam(
    req.headers["x-github-event"],
  ) as EmitterWebhookEvent["name"];

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

  const emitterEvent: EmitterWebhookEvent = {
    id: githubDelivery,
    // Typing seems broken here?
    name: githubEventName as any,
    payload: req.body,
  };

  try {
    await receiveEvent(emitterEvent, supabaseClient, res);
  } catch (error) {
    console.error("Error handling event", error);
    return res.status(500).send({ error: "Error handling event" });
  }
};

const receiveEvent = async (
  emitterEvent: EmitterWebhookEvent,
  supabaseClient: SupabaseClient,
  res: NextApiResponse,
) => {
  if (emitterEvent.name === "pull_request") {
    await githubEventWrapper({
      supabaseClient,
      githubEvent: emitterEvent,
      res,
      handler: handlePullRequestEvent,
    });
  } else if (emitterEvent.name === "pull_request_review_comment") {
    await githubEventWrapper({
      supabaseClient,
      githubEvent: emitterEvent,
      res,
      handler: handlePullRequestCommentEvent,
    });
  } else {
    console.debug(`Got unhandled event name of ${emitterEvent}`);
    return res.status(200).send({ ok: true });
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
