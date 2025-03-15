import { getSessionToken } from "@auth/getSessionToken";
import { Organization, Member, Repository } from "@core/dynamodb/entities/types";
import { QueryClient } from "@tanstack/react-query";
import ky from "ky";
import { INSTALLATION_QUERY_KEY } from "./[orgId]/useOrganization";
import { ORGANIZATION_MEMBERS_QUERY_KEY } from "./[orgId]/useOrganizationMembers";
import { reposKey } from "./[orgId]/tabs/github/useRepos";

/**
 * Prefetches all organization-related queries
 */
export const prefetchOrgQueries = async (
  queryClient: QueryClient,
  orgId: number
): Promise<void> => {
  const token = getSessionToken();
  if (!token) return;

  const headers = {
    Authorization: `Bearer ${token}`,
  };
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Prefetch organization details
  queryClient.prefetchQuery({
    queryKey: [INSTALLATION_QUERY_KEY, orgId],
    queryFn: async () => {
      return await ky
        .get(`${apiUrl}/org/${orgId}`, { headers })
        .json<Organization>();
    },
  });

  // Prefetch organization members
  queryClient.prefetchQuery({
    queryKey: [ORGANIZATION_MEMBERS_QUERY_KEY, orgId],
    queryFn: async () => {
      return await ky
        .get(`${apiUrl}/org/${orgId}/members`, { headers })
        .json<Member[]>();
    },
  });

  // Prefetch organization repositories
  queryClient.prefetchQuery({
    queryKey: [reposKey, orgId],
    queryFn: async () => {
      return await ky
        .get(`${apiUrl}/gh/${orgId}/repositories`, { headers })
        .json<Repository[]>();
    },
  });
};