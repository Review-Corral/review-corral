import { FC } from "react";
import { useSlackIntegrations } from "./useSlackIntegrations";

interface SlackIntegrationsProps {
  organizationId: string;
}

export const SlackIntegrations: FC<SlackIntegrationsProps> = ({
  organizationId,
}) => {
  const slackIntegrations = useSlackIntegrations(organizationId);
  // const usernameMapping = useGetUsernameMappings(teamId);

  if (slackIntegrations.isLoading) {
    return <div>Loading...</div>;
  }

  if (!slackIntegrations.data || slackIntegrations.data.length < 1) {
    return <div>No data... </div>;
  }

  return <div>{slackIntegrations.data[0].channel_name}</div>;
};
