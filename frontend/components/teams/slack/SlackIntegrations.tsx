import { FC } from "react";
import { useSlackIntegrations } from "./useSlackIntegrations";

interface SlackIntegrationsProps {
  teamId: string;
}

export const SlackIntegrations: FC<SlackIntegrationsProps> = ({ teamId }) => {
  const slackIntegrations = useSlackIntegrations(teamId);
  return <div></div>;
};
