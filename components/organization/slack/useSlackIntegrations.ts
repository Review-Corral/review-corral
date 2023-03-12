import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { ApiResponse } from "../../../services/utils/apiBaseTypes";
import { Database } from "../../../types/database-types";

export const GET_SLACK_INTEGRATIONS_KEY = "getSlackIntegrations";

export type SlackIntegration =
  Database["public"]["Tables"]["slack_integration"]["Row"];

export const useSlackIntegrations = ({
  organizationId,
}: {
  organizationId: string;
}) => {
  return useQuery<SlackIntegration[] | null, AxiosError>(
    [GET_SLACK_INTEGRATIONS_KEY, organizationId],
    async () => {
      return (
        await axios.get<ApiResponse<SlackIntegration[] | null>>(
          `/api/slack/${organizationId}/integrations`,
        )
      ).data.data;
    },
  );
};
