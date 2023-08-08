import { Organization } from "@/components/organization/shared";
import { EmitterWebhookEvent } from "@octokit/webhooks";
import { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
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
  handler: handleEvent,
}: {
  supabaseClient: SupabaseClient<Database>;
  githubEvent: T;
  handler: (
    event: T["payload"],
    baseProps: BaseGithubHanderProps,
  ) => Promise<void>;
}): Promise<NextResponse> => {
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
    return NextResponse.json(
      { error: "Error finding Github Repository" },
      { status: 500 },
    );
  }

  const organization = flattenType<Organization>(
    githubRepository?.organization,
  );

  if (!organization) {
    console.warn("No organization found for repository_id: ", {
      orgId: githubEvent.payload.repository.id,
    });
    return NextResponse.json(
      { error: "No Organization found" },
      { status: 404 },
    );
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
    return NextResponse.json(
      { error: "No Slack Integration found" },
      { status: 404 },
    );
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
    return NextResponse.json(
      { error: "Error handling event" },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: "OK" }, { status: 200 });
};
