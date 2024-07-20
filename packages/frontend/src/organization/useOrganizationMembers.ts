import { Member } from "@core/dynamodb/entities/types";
import { UpdateMemberArgs } from "@core/fetchTypes/updateOrgMember";
import ky from "ky";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { getSessionToken } from "src/auth/getSessionToken";

export const ORGANIZATION_MEMBERS_QUERY_KEY = "organizationMembers";

export const useOrganizationMembers = (orgId: number) => {
  return useQuery({
    queryKey: [ORGANIZATION_MEMBERS_QUERY_KEY],
    queryFn: async () => {
      return await ky
        .get(`${import.meta.env.VITE_API_URL}/org/${orgId}/members`, {
          headers: {
            Authorization: `Bearer ${getSessionToken()}`,
          },
        })
        .json<Member[]>();
    },
  });
};

export const useMutateOrganizationMembers = (orgId: number) => {
  const queryClient = useQueryClient();

  return useMutation(
    ["repo", "setActive"],
    async (args: UpdateMemberArgs) => {
      return await ky
        .put(`${import.meta.env.VITE_API_URL}/org/${orgId}/member`, {
          body: JSON.stringify(args),
          headers: {
            Authorization: `Bearer ${getSessionToken()}`,
          },
        })
        .json<Member>();
    },
    {
      onSettled: () => {
        queryClient.refetchQueries([ORGANIZATION_MEMBERS_QUERY_KEY]);
      },
    },
  );
};
