import { Organization } from "@/components/organization/shared";
import { SupabaseClient } from "@supabase/supabase-js";
import { NextApiResponse } from "next";
import { GithubEventHandler } from "services/github/GithubEventHandler";
import { getSlackClient } from "services/slack/SlackClient";
import { flattenType } from "services/utils/apiUtils";
import { analytics } from "services/utils/segment";
import { GithubEvent } from "types/github-event-types";

export const handleGithubEvent = async ({
  supabaseClient,
  githubEvent,
  res,
}: {
  supabaseClient: SupabaseClient;
  githubEvent: GithubEvent;
  res: NextApiResponse;
}): Promise<void> => {
  const body = githubEvent;

  console.log("Got Github Event", {
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
    const slackClient = getSlackClient();

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
