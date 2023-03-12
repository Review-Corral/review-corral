/* eslint-disable no-console */
import { SupabaseClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";
import { NextApiRequest, NextApiResponse } from "next";
import { AxiomAPIRequest, withAxiom } from "next-axiom/dist/withAxiom";
import { handleGithubEvent } from "services/github/handleGithubEvent";
import withApiSupabase from "../../../../services/utils/withApiSupabase";
import { GithubEvent } from "../../../../types/github-types";

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

  handleGithubEvent({ supabaseClient, githubEvent: body, res });
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
