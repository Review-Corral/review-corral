import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { SyncedRepository } from "./types";

export const useGetSyncedRepos = (teamId: string) => {
  return useQuery<SyncedRepository[] | undefined, AxiosError>(
    ["getSyncedRepos", teamId],
    async () => {
      return (
        await axios.get<SyncedRepository[] | undefined>(
          `/api/proxy/github/synced-repositories?teamId=${teamId}`,
        )
      ).data;
    },
  );
};
