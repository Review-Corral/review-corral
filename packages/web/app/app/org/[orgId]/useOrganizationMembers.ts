import { getSessionToken } from "@auth/getSessionToken";
import { Member } from "@core/dynamodb/entities/types";
import { UpdateMemberArgs } from "@core/fetchTypes/updateOrgMember";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ky from "ky";

export const ORGANIZATION_MEMBERS_QUERY_KEY = "organizationMembers";

export const useOrganizationMembers = (orgId: number) => {
  return useQuery({
    queryKey: [ORGANIZATION_MEMBERS_QUERY_KEY],
    queryFn: async () => {
      return await ky
        .get(`${process.env.NEXT_PUBLIC_API_URL}/org/${orgId}/members`, {
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

  return useMutation({
    mutationKey: ["repo", "setActive"],
    mutationFn: async (args: UpdateMemberArgs) => {
      return await ky
        .put(`${process.env.NEXT_PUBLIC_API_URL}/org/${orgId}/member`, {
          body: JSON.stringify(args),
          headers: {
            Authorization: `Bearer ${getSessionToken()}`,
          },
        })
        .json<Member>();
    },
    onSettled: () => {
      queryClient.refetchQueries({ queryKey: [ORGANIZATION_MEMBERS_QUERY_KEY] });
    },
  });
};
