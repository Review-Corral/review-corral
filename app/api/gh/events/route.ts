/* eslint-disable no-console */
import { flattenParam } from "@/components/utils/flattenParam";
import { EmitterWebhookEvent } from "@octokit/webhooks";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { SupabaseClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";
import { withAxiom } from "next-axiom/dist/withAxiom";
import { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { githubEventWrapper } from "services/github/githubEventWrapper";
import { handlePullRequestEvent } from "services/github/handlePrEvent";
import { handlePullRequestCommentEvent } from "services/github/handlePrReviewCommentEvent";
import { handlePullRequestReviewEvent } from "services/github/handlePrReviewEvent";
import { Database } from "types/database-types";

export const POST = withAxiom(async (req: Request) => {
  const supabaseClient = createRouteHandlerClient<Database>({ cookies });
  console.log("Got request to POST /api/gh/events");

  const headersList = headers();

  const validEvent = await checkEventWrapper(req, headersList);

  if (!validEvent) {
    console.error("Got event with invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  console.log("Event has valid signature");

  const githubDelivery = flattenParam(headersList.get("x-github-delivery"));
  const githubEventName = flattenParam(
    headersList.get("x-github-event"),
  ) as EmitterWebhookEvent["name"];

  if (!githubDelivery || !githubEventName) {
    console.warn(
      "Got Github event with valid signature but missing headers: ",
      {
        githubDelivery,
        githubEventName,
      },
    );

    return NextResponse.json({ error: "Missing headers" }, { status: 400 });
  }

  const body = await req.json();

  const emitterEvent: EmitterWebhookEvent = {
    id: githubDelivery,
    // Typing seems broken here?
    name: githubEventName as any,
    payload: body,
  };

  try {
    await receiveEvent(emitterEvent, supabaseClient);
  } catch (error) {
    console.error("Error handling event", error);
    return NextResponse.json(
      { error: "Error handling event" },
      { status: 500 },
    );
  }
});

const receiveEvent = async (
  emitterEvent: EmitterWebhookEvent,
  supabaseClient: SupabaseClient,
) => {
  if (emitterEvent.name === "pull_request") {
    return await githubEventWrapper<EmitterWebhookEvent<"pull_request">>({
      supabaseClient,
      githubEvent: emitterEvent,
      handler: handlePullRequestEvent,
    });
  } else if (emitterEvent.name === "pull_request_review_comment") {
    return await githubEventWrapper({
      supabaseClient,
      githubEvent: emitterEvent,
      handler: handlePullRequestCommentEvent,
    });
  } else if (emitterEvent.name === "pull_request_review") {
    return await githubEventWrapper({
      supabaseClient,
      githubEvent: emitterEvent,
      handler: handlePullRequestReviewEvent,
    });
  } else {
    console.debug(`Got unhandled event name of ${emitterEvent.name}`);
    return NextResponse.json({ data: "OK" }, { status: 200 });
  }
};

const checkEventWrapper = async (
  req: Request,
  headersList: ReadonlyHeaders,
) => {
  if (!process.env.GITHUB_WEBHOOK_SECRET) {
    console.error("No GITHUB_WEBHOOK_SECRET set");
    return false;
  }
  try {
    const signature = headersList.get("x-hub-signature-256");

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
  req: Request;
  signature: string;
  secret: string;
}) => {
  const body = await req.text();
  const hmac = createHmac("sha256", secret);
  hmac.update(JSON.stringify(body));
  const calculated = `sha256=${hmac.digest("hex")}`;

  return calculated === signature;
};
