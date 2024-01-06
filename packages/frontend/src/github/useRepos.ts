import { Repository } from "@core/db/types";
import ky from "ky";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { getSessionToken } from "src/auth/getSessionToken";

type setRepoActiveStatusArgs = Required<Pick<Repository, "id" | "isActive">>;
export const reposKey = "repositories";

export const useOrganizationRepositories = (orgId: number) => {
  return useQuery({
    queryKey: [reposKey, orgId],
    queryFn: async () => {
      return await ky
        .get(
          `${
            import.meta.env.VITE_API_URL
          }/gh/installations/${orgId}/repositories`,
          {
            headers: {
              Authorization: `Bearer ${getSessionToken()}`,
            },
          }
        )
        .json<Repository[]>();
    },
  });
};

export const useSetRepoActive = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Repository,
    unknown,
    setRepoActiveStatusArgs,
    Repository[]
  >(
    ["repo", "setActive"],
    async (args) => {
      return await ky
        .put(`${import.meta.env.VITE_API_URL}/gh/repositories/${args.id}`, {
          body: JSON.stringify({ isActive: args.isActive }),
          headers: {
            Authorization: `Bearer ${getSessionToken()}`,
          },
        })
        .json<Repository>();
    },
    {
      onSettled: () => {
        queryClient.refetchQueries([reposKey]);
      },
    }
  );
};
