import { Loading } from "@components/ui/cards/loading";
import { FC } from "react";
import SetupSlackLink from "./SetupSlackLink";
import { useSlackIntegrations } from "./useSlackIntegrations";

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
        <SetupSlackLink organizationId={organizationId} />
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
