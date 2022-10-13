import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

export type SlackIntegration = {
  id: string;
  created_at: Date | null;
  access_token: string | null;
  channel_id: string | null;
  team: string | null;
  channel_name: string;
  updated_at: Date | null;
};

export const useSlackIntegrations = (teamId: string) => {
  return useQuery<SlackIntegration[] | undefined, AxiosError>(
    ["getSlackIntegrations", teamId],
    async () => {
      return (
        await axios.get<SlackIntegration[] | undefined>(
          `/api/proxy/slack/integrations?teamId=${teamId}`,
        )
      ).data;
    },
  );
};
