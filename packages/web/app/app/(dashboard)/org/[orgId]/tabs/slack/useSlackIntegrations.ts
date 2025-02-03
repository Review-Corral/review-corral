import { getSessionToken } from "@auth/getSessionToken";
import { Organization, SlackIntegration } from "@core/dynamodb/entities/types";
import { useQuery } from "@tanstack/react-query";
import ky from "ky";

export const SLACK_INTEGRATIONS_QUERY_KEY = "slack-integrations";

export const useSlackIntegrations = (organizationId: Organization["orgId"]) => {
  return useQuery({
    queryKey: [SLACK_INTEGRATIONS_QUERY_KEY, organizationId],
    queryFn: async () => {
      return await ky
        .get(
          `${
            process.env.NEXT_PUBLIC_API_URL
          }/slack/${organizationId.toString()}/installations`,
          {
            headers: {
              Authorization: `Bearer ${getSessionToken()}`,
            },
          },
        )
        .json<SlackIntegration[]>();
    },
  });
};
