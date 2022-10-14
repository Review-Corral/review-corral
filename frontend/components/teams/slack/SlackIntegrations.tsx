import { FC } from "react";
import { useSlackIntegrations } from "./useSlackIntegrations";

interface SlackIntegrationsProps {
  teamId: string;
}

export const SlackIntegrations: FC<SlackIntegrationsProps> = ({ teamId }) => {
  const slackIntegrations = useSlackIntegrations(teamId);

  if (slackIntegrations.isLoading) {
    return <div>Loading...</div>;
  }

  return <div>{slackIntegrations.data![0].channel_name}</div>;
};
