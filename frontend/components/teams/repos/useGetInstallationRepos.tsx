import { useMutation, useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { Database } from "../../../database-types";
import { PutRepositoryArgs } from "../../../pages/api/gh/repositories/[installationId]";
import { ApiResponse } from "../../api/utils/apiBaseTypes";

type GithubRepositories =
  Database["public"]["Tables"]["github_repositories"]["Row"];

export const useGetInstallationRepos = (installationId: number) => {
  return useQuery<GithubRepositories[], AxiosError>(
    ["getInstalledRepos", installationId],
    async () => {
      console.log("going to request with installation id", installationId);
      return (
        await axios.get<ApiResponse<GithubRepositories[]>>(
          `/api/gh/repositories/${installationId}`,
        )
      ).data.data;
    },
  );
};

export const useMutateInstallationRepo = ({
  installationId,
}: {
  installationId: number;
}) => {
  return useMutation<void, AxiosError, PutRepositoryArgs, GithubRepositories[]>(
    ["getInstalledRepos", installationId],
    async (args) => {
      await axios.put<ApiResponse<null>>(
        `/api/gh/repositories/${installationId}`,
        args,
      );
    },
  );
};
