import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Database } from "../../../../database-types";

export type UsernameMapping =
  Database["public"]["Tables"]["username_mappings"]["Row"];

export const USE_GET_USERNAME_MAPPINGS_KEY = "useGetUsernameMappings";

export const useGetUsernameMappings = (organizationId: string) => {
  const supabaseClient = useSupabaseClient<Database>();
  return useQuery<UsernameMapping[] | undefined, AxiosError>(
    [USE_GET_USERNAME_MAPPINGS_KEY, organizationId],
    async () => {
      const { data, error } = await supabaseClient
        .from("username_mappings")
        .select("*")
        .eq("organization_id", organizationId);

      if (error) {
        console.error("Error getting username mappings", error);
        throw new Error("Error getting username mappings");
      }

      return data;
    },
  );
};
