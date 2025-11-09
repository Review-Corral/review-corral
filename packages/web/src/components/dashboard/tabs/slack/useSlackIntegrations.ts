import { getSessionToken } from "@/lib/auth/getSessionToken";
import { Organization, SlackIntegration } from "@core/apiTypes";
import { useQuery } from "@tanstack/react-query";
import ky from "ky";

export const SLACK_INTEGRATIONS_QUERY_KEY = "slack-integrations";

export const useSlackIntegrations = (organizationId: Organization["id"]) => {
  return useQuery({
    queryKey: [SLACK_INTEGRATIONS_QUERY_KEY, organizationId],
    queryFn: async () => {
      return await ky
        .get(
          `${
            import.meta.env.VITE_API_URL
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
