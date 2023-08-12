import { Organization } from "@/components/organization/shared";
import { EmitterWebhookEvent } from "@octokit/webhooks";
import { SupabaseClient } from "@supabase/supabase-js";
import { NextApiResponse } from "next";
import { Db } from "services/db";
import { SlackClient } from "services/slack/SlackClient";
import { flattenType } from "services/utils/apiUtils";
import { Database } from "types/database-types";
import { BaseGithubHanderProps } from "./shared";

export const githubEventWrapper = async <
  T extends EmitterWebhookEvent<
    "pull_request" | "pull_request_review_comment" | "pull_request_review"
  >,
>({
  supabaseClient,
  githubEvent,
  res,
  handler: handleEvent,
}: {
  supabaseClient: SupabaseClient<Database>;
  githubEvent: T;
  res: NextApiResponse;
  handler: (
    event: T["payload"],
    baseProps: BaseGithubHanderProps,
  ) => Promise<void>;
}): Promise<void> => {
  console.log("Got Github Event", {
    action: githubEvent.payload.action,
    id: githubEvent.payload.pull_request.id,
  });

  const repositoryId: Number = Number(githubEvent.payload.repository.id);

  const { data: githubRepository, error } = await supabaseClient
    .from("github_repositories")
    .select("id, organization:organizations (*)")
    .eq("repository_id", repositoryId)
    .single();

  if (error) {
    console.error(`Error finding Github Repository with id: `, {
      pull_request_id: githubEvent.payload.pull_request.id,
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
      orgId: githubEvent.payload.repository.id,
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

  try {
    await handleEvent(githubEvent["payload"], {
      database: new Db(supabaseClient),
      slackClient,
      organizationId: organization.id,
      installationId: organization.installation_id,
    });
  } catch (error) {
    console.error(`Got error handling event`, error);
    return res.status(400).send({ error: "Error handling event" });
  }

  return res.status(200).send({ data: "OK" });
};
