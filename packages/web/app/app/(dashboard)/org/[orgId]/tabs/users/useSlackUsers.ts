import ky from "ky";

import { getSessionToken } from "@auth/getSessionToken";
// THis is super hacky, but gets the job done for now
import { SlackUser } from "@core/dynamodb/entities/types";
import { useQuery } from "@tanstack/react-query";

export const SLACK_USERS_QUERY_KEY = "slackInstallMembers";

export const useSlackUsers = (orgId: number) =>
  useQuery({
    queryKey: [SLACK_USERS_QUERY_KEY, orgId],
    queryFn: async () => {
      return await ky
        .get(`${process.env.NEXT_PUBLIC_API_URL}/slack/${orgId}/users`, {
          headers: {
            Authorization: `Bearer ${getSessionToken()}`,
          },
        })
        .json<SlackUser[]>();
    },
    staleTime: 1000 * 60 * 2, // 2 minutes,
  });
