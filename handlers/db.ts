import { PostgrestSingleResponse, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "types/database-types";

interface BaseProps {
  organizationId: string;
}

type PullRequest = Database["public"]["Tables"]["pull_requests"];
export type PullRequestRow = PullRequest["Row"];

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

  insertPullRequest = async (props: PullRequest["Insert"]) => {
    const response = await this.client
      .from("pull_requests")
      .insert(props)
      .select();

    console.debug("Response from insertPullRequest: ", response);
  };

  updatePullRequest = async ({
    pr_id: prId,
    thread_ts,
    draft,
  }: PullRequest["Update"]) => {
    const response = await this.client
      .from("pull_requests")
      .update({
        draft,
        thread_ts,
      })
      .eq("pr_id", prId)
      .select();

    console.debug("Response from updatePullRequest: ", response);
  };
}
