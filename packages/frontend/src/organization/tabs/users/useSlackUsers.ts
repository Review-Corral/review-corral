import { SlackIntegrationUsers } from "@core/dynamodb/fetchers/slack";
import ky from "ky";
import { useQuery } from "react-query";
import { getSessionToken } from "src/auth/getSessionToken";

export const useSlackUsers = (orgId: number) =>
  useQuery({
    queryKey: ["slackInstallMembers"],
    queryFn: async () => {
      return await ky
        .get(`${import.meta.env.VITE_API_URL}/slack/${orgId}/users`, {
          headers: {
            Authorization: `Bearer ${getSessionToken()}`,
          },
        })
        .json<SlackIntegrationUsers[]>();
    },
  });
