import { supabaseClient } from "@supabase/auth-helpers-nextjs";

export function getAccessTokenSafe(): string | undefined {
  return supabaseClient.auth.session()?.access_token ?? undefined;
}
