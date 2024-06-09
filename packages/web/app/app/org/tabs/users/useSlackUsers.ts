import ky from "ky";
import { useQuery } from "react-query";
import { getSessionToken } from "src/auth/getSessionToken";
// THis is super hacky, but gets the job done for now
import { SlackUser } from "@core/dynamodb/entities/types";

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
        .json<SlackUser[]>();
    },
    staleTime: 1000 * 60 * 2, // 2 minutes,
  });
