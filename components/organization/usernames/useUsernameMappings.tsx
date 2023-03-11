import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Database } from "../../../types/database-types";

export type UsernameMapping =
  Database["public"]["Tables"]["username_mappings"]["Row"];

export type CreateUsernameMappingArgs =
  Database["public"]["Tables"]["username_mappings"]["Insert"];

export type UpdateUsernameMappingArgs =
  Database["public"]["Tables"]["username_mappings"]["Update"];

export const USE_GET_USERNAME_MAPPINGS_KEY = "useGetUsernameMappings";
export const USE_CREATE_USERNAME_MAPPING_KEY = "postUsernameMapping";
export const USE_UPDATE_USERNAME_MAPPING_KEY = "updateUsernameMapping";
export const USE_DELETE_USERNAME_MAPPING_KEY = "deleteUsernameMapping";

export const useGetUsernameMappings = (
  organizationId: string,
  { enabled = true }: { enabled?: boolean } = {},
) => {
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
    {
      enabled,
    },
  );
};

export const useCreateUsernameMapping = (organizationId: string) => {
  const supabaseClient = useSupabaseClient<Database>();
  const queryClient = useQueryClient();

  return useMutation<
    UsernameMapping,
    unknown,
    CreateUsernameMappingArgs,
    UsernameMapping
  >(
    [USE_CREATE_USERNAME_MAPPING_KEY, organizationId],
    async (args) => {
      const { data, error } = await supabaseClient
        .from("username_mappings")
        .insert({
          ...args,
          organization_id: organizationId,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating username mapping", error);
        throw new Error("Error creating username mapping");
      }

      return data;
    },
    {
      onSuccess(_data, _variables, _context) {
        queryClient.refetchQueries([
          USE_GET_USERNAME_MAPPINGS_KEY,
          organizationId,
        ]);
      },
    },
  );
};

export const useUpdateUsernameMapping = (organizationId: string) => {
  const supabaseClient = useSupabaseClient<Database>();
  const queryClient = useQueryClient();

  return useMutation<
    UsernameMapping,
    unknown,
    Omit<UpdateUsernameMappingArgs, "id"> & { id: string },
    UsernameMapping
  >(
    [USE_UPDATE_USERNAME_MAPPING_KEY, organizationId],
    async ({ id, ...args }) => {
      const { data, error } = await supabaseClient
        .from("username_mappings")
        .update({
          ...args,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating username mapping", error);
        throw new Error("Error updating username mapping");
      }

      return data;
    },
    {
      onSuccess(data, _variables, _context) {
        queryClient.refetchQueries([
          USE_GET_USERNAME_MAPPINGS_KEY,
          organizationId,
        ]);
      },
    },
  );
};
