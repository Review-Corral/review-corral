import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

export const USE_SYNC_REPO_KEY = "syncRepo";

export interface CreateTeamRepoBody {
  teamId: string;
  repositoryName: string;
  repositoryId: number;
  installationId: number;
}

export const useSyncRepo = (teamId: string) => {
  return useMutation<void, AxiosError, CreateTeamRepoBody>(
    [USE_SYNC_REPO_KEY, teamId],
    async (data) => {
      await axios.post(`/api/proxy/github/synced-repositories`, data);
    },
  );
};
