import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "types/database-types";

interface BaseProps {
  organizationId: string;
}

export class Db {
  constructor(public readonly client: SupabaseClient<Database>) {}

  getThreadTs = async ({ prId }: { prId: string }) =>
    await this.client
      .from("pull_requests")
      .select("thread_ts")
      .eq("pr_id", prId.toString())
      .single();

  getSlackUserIdFromGithubLogin = async ({
    githubLogin,
    organizationId,
  }: {
    githubLogin: string;
  } & BaseProps) =>
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
  } & BaseProps) =>
    await this.client.from("pull_requests").insert({
      pr_id: prId.toString(),
      is_draft: props.isDraft,
      thread_ts: threadTs,
      organization_id: props.organizationId,
    });
}
