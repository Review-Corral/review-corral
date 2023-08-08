import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { PutRepositoryArgs } from "../../../app/api/gh/repositories/[installationId]/route";
import { ApiResponse } from "../../../services/utils/apiBaseTypes";
import { Database } from "../../../types/database-types";

type GithubRepositories =
  Database["public"]["Tables"]["github_repositories"]["Row"];

export const useGetInstallationRepos = (installationId: number) => {
  return useQuery<GithubRepositories[], AxiosError>(
    ["getInstalledRepos", installationId],
    async () => {
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
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, PutRepositoryArgs, GithubRepositories[]>(
    ["getInstalledRepos", installationId],
    async (args) => {
      await axios.put<ApiResponse<null>>(
        `/api/gh/repositories/${installationId}`,
        args,
      );
    },
    {
      onSuccess(_data, _variables, _context) {
        queryClient.refetchQueries(["getInstalledRepos", installationId]);
      },
    },
  );
};
