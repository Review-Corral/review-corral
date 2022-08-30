import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

export const USE_DELETE_SYNCED_REPO_KEY = "deleteSyncedRepo";

export const useDeleteSyncedRepo = (teamId: string) => {
  return useMutation<void, AxiosError, { repoId: string }>(
    [USE_DELETE_SYNCED_REPO_KEY, teamId],
    async (data) => {
      await axios.delete(`/api/proxy/github/synced-repositories`, {
        data,
      });
    },
  );
};
