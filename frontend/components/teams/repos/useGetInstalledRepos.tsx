import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { InstalledRepository } from "./types";

export const useGetInstalledRepos = (teamId: string) => {
  return useQuery<InstalledRepository[] | undefined, AxiosError>(
    ["getInstalledRepos", teamId],
    async () => {
      return (
        await axios.get<InstalledRepository[] | undefined>(
          `/api/proxy/github/installed-repositories?teamId=${teamId}`,
        )
      ).data;
    },
  );
};
