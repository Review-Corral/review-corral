import { PostgrestSingleResponse, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "types/database-types";

interface BaseProps {
  organizationId: string;
}

export class Db {
  constructor(public readonly client: SupabaseClient<Database>) {}

  getThreadTs = async ({ prId }: { prId: string }) =>
    await this.client
      .from("pull_requests")
      .select("pr_id, threadTs")
      .eq("pr_id", prId)
      .single();

  getSlackUserIdFromGithubLogin = async ({
    githubLogin,
    organizationId,
  }: {
    githubLogin: string;
  } & BaseProps): Promise<
    PostgrestSingleResponse<{
      slack_user_id: string;
    }>
  > =>
    await this.client
      .from("username_mappings")
      .select("slack_user_id")
      .eq("github_username", githubLogin)
      .eq("organization_id", organizationId)
      .single();

  insertPullRequest = async ({
    prId,
    threadTs,
    ...props
  }: {
    threadTs: string | null;
    isDraft: boolean;
    prId: string;
  } & BaseProps) => {
    const response = await this.client
      .from("pull_requests")
      .insert({
        pr_id: prId.toString(),
        draft: props.isDraft,
        thread_ts: threadTs,
        organization_id: props.organizationId,
      })
      .select();

    console.debug("Response from insertPullRequest: ", response);
  };
}
