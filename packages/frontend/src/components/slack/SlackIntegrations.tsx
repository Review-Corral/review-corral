import { FC } from "react";
import SlackButton from "../../SlackButton";
import { useSlackIntegrations } from "./useSlackIntegrations";

interface SlackIntegrationsProps {
  organizationId: string;
}

export const SlackIntegrations: FC<SlackIntegrationsProps> = ({
  organizationId,
}) => {
  const { isLoading, data, error } = useSlackIntegrations({ organizationId });

  if (isLoading) {
    return <div>Loading...</div>;
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
        <div key={integration.id} className="flex flex-row">
          <div>{integration.channel_name}</div>
        </div>
      ))}
    </div>
  );
};
