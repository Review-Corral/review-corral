import { Member } from "@core/dynamodb/entities/types";
import ky from "ky";
import { useQuery } from "react-query";
import { getSessionToken } from "src/auth/getSessionToken";

export const ORGANIZATION_MEMBERS_QUERY_KEY = "organizationMembers";

export const useOrganizationMembers = (orgId: string) => {
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
