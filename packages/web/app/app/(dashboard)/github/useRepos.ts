import { Repository } from "@core/dynamodb/entities/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ky from "ky";
import { getSessionToken } from "../../auth/getSessionToken";

type setRepoActiveStatusArgs = Required<
  Pick<Repository, "repoId" | "isEnabled" | "orgId">
>;
export const reposKey = "repositories";

export const useOrganizationRepositories = (orgId: number) => {
  return useQuery({
    queryKey: [reposKey, orgId],
    queryFn: async () => {
      return await ky
        .get(
          `${process.env.NEXT_PUBLIC_API_URL}/gh/installations/${orgId}/repositories`,
          {
            headers: {
              Authorization: `Bearer ${getSessionToken()}`,
            },
          },
        )
        .json<Repository[]>();
    },
  });
};

export const useSetRepoActive = () => {
  const queryClient = useQueryClient();

  return useMutation<Repository, unknown, setRepoActiveStatusArgs, Repository[]>({
    mutationKey: ["repo", "setActive"],
    mutationFn: async (args) => {
      return await ky
        .put(
          `${process.env.NEXT_PUBLIC_API_URL}/gh/${args.orgId}/repositories/${args.repoId}`,
          {
            body: JSON.stringify({ isActive: args.isEnabled }),
            headers: {
              Authorization: `Bearer ${getSessionToken()}`,
            },
          },
        )
        .json<Repository>();
    },
    onSettled: () => {
      queryClient.refetchQueries({ queryKey: [reposKey] });
    },
  });
};
