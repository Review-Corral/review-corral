import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { ApiResponse } from "../../api/utils/apiBaseTypes";

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
  return useQuery<SlackIntegration[] | null, AxiosError>(
    ["getSlackIntegrations", organizationId],
    async () => {
      return (
        await axios.get<ApiResponse<SlackIntegration[] | null>>(
          `/api/slack/${organizationId}/integrations`,
        )
      ).data.data;
    },
  );
};
