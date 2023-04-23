import { PostgrestSingleResponse, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "types/database-types";

interface BaseProps {
  organizationId: string;
}

export type PullRequestRow =
  Database["public"]["Tables"]["pull_requests"]["Row"];

export class Db {
  constructor(public readonly client: SupabaseClient<Database>) {}

  getPullRequest = async ({
    prId,
  }: {
    prId: string;
  }): Promise<PostgrestSingleResponse<PullRequestRow | null>> =>
    await this.client
      .from("pull_requests")
      .select()
      .eq("pr_id", prId)
      .maybeSingle();

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
      })
      .select();

    console.debug("Response from insertPullRequest: ", response);
  };

  updatePullRequest = async ({
    prId,
    threadTs,
    ...props
  }: {
    threadTs: string;
    isDraft: boolean;
    prId: string;
  } & BaseProps) => {
    const response = await this.client
      .from("pull_requests")
      .update({
        draft: props.isDraft,
        thread_ts: threadTs,
      })
      .eq("pr_id", prId)
      .select();

    console.debug("Response from updatePullRequest: ", response);
  };
}
