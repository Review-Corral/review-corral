import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

export type UsernameMapping = {
  id: string;
  created_at: Date | null;
  github_username: string;
  slack_user_id: string;
  team_id: string | null;
  updated_at: Date | null;
};

export const USE_GET_USERNAME_MAPPINGS_KEY = "useGetUsernameMappings";

export const useGetUsernameMappings = (teamId: string) => {
  return useQuery<UsernameMapping[] | undefined, AxiosError>(
    [USE_GET_USERNAME_MAPPINGS_KEY, teamId],
    async () => {
      return (
        await axios.get<UsernameMapping[] | undefined>(
          `/api/proxy/teams/username-mappings/${teamId}`,
        )
      ).data;
    },
  );
};
