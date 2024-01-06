import { Organization, SlackIntegration } from "@core/db/types";
import ky from "ky";
import { useQuery } from "react-query";
import { getSessionToken } from "src/auth/getSessionToken";

export const SLACK_INTEGRATIONS_QUERY_KEY = "slack-integrations";

export const useSlackIntegrations = (organizationId: Organization["id"]) => {
  return useQuery({
    queryKey: [SLACK_INTEGRATIONS_QUERY_KEY],
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
          }
        )
        .json<SlackIntegration[]>();
    },
  });
};
