import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

export type GithubIntegration = {
  id: string;
  created_at: Date | null;
  team_id: string;
  access_token: string;
  updated_at: Date | null;
};

export const GET_GITHUB_INTEGRATION_QUERY_KEY = "getGithubIntegration";

export const useGithubIntegration = (teamId: string) => {
  return useQuery<GithubIntegration | undefined, AxiosError>(
    [GET_GITHUB_INTEGRATION_QUERY_KEY, teamId],
    async () => {
      return (
        await axios.get<GithubIntegration | undefined>(
          `/api/proxy/github/integration?teamId=${teamId}`,
        )
      ).data;
    },
  );
};
