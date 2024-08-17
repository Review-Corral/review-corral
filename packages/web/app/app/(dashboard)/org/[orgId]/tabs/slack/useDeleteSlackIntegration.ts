import { auth_access_token_key } from "@auth/const";
import { SlackIntegration } from "@core/dynamodb/entities/types";
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
        `${process.env.NEXT_PUBLIC_API_URL}/org/${slackIntegration.orgId}/instalations/${slackIntegration.slackTeamId}`,
        {
          headers: {
            Authorization: `Bearer ${Cookies.get(auth_access_token_key)}`,
          },
          body: JSON.stringify({
            orgId: slackIntegration.orgId,
            slackTeamId: slackIntegration.slackTeamId,
            channelId: slackIntegration.channelId,
          }),
        },
      );
    },
  });
};
