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

export const useSlackIntegrations = ({
  organizationId,
}: {
  organizationId: string;
}) => {
  return useQuery<SlackIntegration[] | undefined, AxiosError>(
    ["getSlackIntegrations", organizationId],
    async () => {
      return (
        await axios.get<SlackIntegration[] | undefined>(
          `/api/slack/${organizationId}/integrations`,
        )
      ).data;
    },
  );
};
