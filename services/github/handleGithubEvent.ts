import { Organization } from "@/components/organization/shared";
import { WebhookEvent } from "@octokit/webhooks-types";
import { SupabaseClient } from "@supabase/supabase-js";
import { NextApiResponse } from "next";
import { Db } from "services/db";
import { SlackClient, getSlackWebClient } from "services/slack/SlackClient";
import { flattenType } from "services/utils/apiUtils";
import { GithubEventHandler } from "./GithubEventHandler";

export const handleGithubEvent = async ({
  supabaseClient,
  githubEvent,
  res,
}: {
  supabaseClient: SupabaseClient;
  githubEvent: WebhookEvent;
  res: NextApiResponse;
}): Promise<void> => {
  console.log("Got Github Event", {
    action: getPropertyFromWebhookIfExists(githubEvent, "action"),
    number: getPropertyFromWebhookIfExists(githubEvent, "number"),
  });

  if ("pull_request" in githubEvent) {
    const slackWebClient = getSlackWebClient();

    const repositoryId: Number = Number(githubEvent.repository.id);

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
        pull_request_id: githubEvent.pull_request.id,
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
        orgId: githubEvent.repository.id,
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

    const slackClient = new SlackClient(
      slackIntegration.channel_id,
      slackIntegration.access_token,
    );

    const eventHandler = new GithubEventHandler(
      new Db(supabaseClient),
      slackClient,
      organization.installation_id,
      organization.id,
    );

    try {
      await eventHandler.handleEvent(githubEvent);
    } catch (error) {
      console.error(`Got error handling event`, error);
      return res.status(400).send({ error: "Error handling event" });
    }
  }

  return res.status(200).send({ data: "OK" });
};

const getPropertyFromWebhookIfExists = (
  event: WebhookEvent,
  property: string,
): unknown | null => {
  if (property in event) {
    // @ts-ignore
    return event[property];
  }

  return null;
};
