import { auth_access_token_key } from "@/app/app/auth/const";
import { useMutation } from "@tanstack/react-query";
import Cookies from "js-cookie";
import ky from "ky";

export const useDeleteSlackIntegration = (slackIntegration: {
  orgId: number;
  slackTeamId: string;
  channelId: string;
}) => {
  return useMutation({
    mutationKey: [
      "delete",
      "slack-integration",
      slackIntegration.orgId,
      slackIntegration.slackTeamId,
      slackIntegration.channelId,
    ],
    mutationFn: async () => {
      return await ky.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/slack/${slackIntegration.orgId}/installations`,
        {
          headers: {
            Authorization: `Bearer ${Cookies.get(auth_access_token_key)}`,
          },
          body: JSON.stringify({
            slackTeamId: slackIntegration.slackTeamId,
            channelId: slackIntegration.channelId,
          }),
        },
      );
    },
  });
};
