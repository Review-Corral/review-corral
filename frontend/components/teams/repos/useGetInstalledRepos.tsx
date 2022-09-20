import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { InstalledRepository } from "./types";

export interface InstalledRepositoryWithInstallationId
  extends InstalledRepository {
  installationId: number;
}

export const useGetInstalledRepos = (teamId: string) => {
  return useQuery<
    InstalledRepositoryWithInstallationId[] | undefined,
    AxiosError
  >(["getInstalledRepos", teamId], async () => {
    return (
      await axios.get<InstalledRepositoryWithInstallationId[] | undefined>(
        `/api/proxy/github/installed-repositories?teamId=${teamId}`,
      )
    ).data;
  });
};
