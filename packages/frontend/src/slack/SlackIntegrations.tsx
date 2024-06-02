import { FC } from "react";
import SlackButton from "./SetupSlackButton";
import { useSlackIntegrations } from "./useSlackIntegrations";
import { Loading } from "@components/ui/cards/loading";

interface SlackIntegrationsProps {
  organizationId: number;
}

export const SlackIntegrations: FC<SlackIntegrationsProps> = ({ organizationId }) => {
  const { isLoading, data } = useSlackIntegrations(organizationId);

  if (isLoading) {
    return <Loading />;
  }

  if (!data || data.length < 1) {
    return (
      <div>
        <SlackButton organizationId={organizationId} />
      </div>
    );
  }

  return (
    <div className="">
      {data.map((integration) => (
        <div
          key={`${integration.slackTeamId}-${integration.channelId}`}
          className="flex flex-row"
        >
          <div>{integration.channelName}</div>
        </div>
      ))}
    </div>
  );
};
