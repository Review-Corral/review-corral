import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { Database } from "../../../database-types";

type GithubRepositories =
  Database["public"]["Tables"]["github_repositories"]["Row"];

export const useGetInstallationRepos = (installationId: number) => {
  return useQuery<GithubRepositories[], AxiosError>(
    ["getInstalledRepos", installationId],
    async () => {
      console.log("going to request with installation id", installationId);
      return (
        await axios.get<GithubRepositories[]>(
          `/api/gh/repositories/${installationId}`,
        )
      ).data;
    },
  );
};
