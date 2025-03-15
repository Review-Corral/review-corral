import { getSessionToken } from "@auth/getSessionToken";
import { Organization, Member, Repository, SlackIntegration, SlackUser } from "@core/dynamodb/entities/types";
import { QueryClient } from "@tanstack/react-query";
import ky from "ky";
import { INSTALLATION_QUERY_KEY } from "./[orgId]/useOrganization";
import { ORGANIZATION_MEMBERS_QUERY_KEY } from "./[orgId]/useOrganizationMembers";
import { reposKey } from "./[orgId]/tabs/github/useRepos";
import { SLACK_INTEGRATIONS_QUERY_KEY } from "./[orgId]/tabs/slack/useSlackIntegrations";
import { SLACK_USERS_QUERY_KEY } from "./[orgId]/tabs/users/useSlackUsers";

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

  // Prefetch Slack integrations
  queryClient.prefetchQuery({
    queryKey: [SLACK_INTEGRATIONS_QUERY_KEY, orgId],
    queryFn: async () => {
      return await ky
        .get(`${apiUrl}/slack/${orgId}/installations`, { headers })
        .json<SlackIntegration[]>();
    },
  });

  // Prefetch Slack users
  queryClient.prefetchQuery({
    queryKey: [SLACK_USERS_QUERY_KEY, orgId],
    queryFn: async () => {
      return await ky
        .get(`${apiUrl}/slack/${orgId}/users`, { headers })
        .json<SlackUser[]>();
    },
    staleTime: 1000 * 60 * 2, // 2 minutes (matching the original query config)
  });
};