import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { InstalledRepository } from "./types";

export const useGetInstalledRepos = (teamId: string) => {
  return useMutation<InstalledRepository[] | undefined, AxiosError>(
    ["getInstalledRepos", teamId],
    async () => {
      return (
        await axios.get<InstalledRepository[] | undefined>(
          `/api/proxy/github/repositories?teamId=${teamId}`,
        )
      ).data;
    },
  );
};
