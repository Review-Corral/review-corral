import { ErrorCard } from "@components/ui/cards/ErrorCard";
import { Slack } from "lucide-react";
import { FC } from "react";
import { OrgViewProps } from "../shared";
import { SetupSlackCard } from "./SetupSlackCard";
import { SlackIntegration } from "./SlackIntegration";
import { useSlackIntegrations } from "./useSlackIntegrations";

interface SlackOverviewCardProps extends OrgViewProps {}

export const SlackOverviewCard: FC<SlackOverviewCardProps> = ({ organization }) => {
  return (
    <div id="github" className="w-96">
      <div className="flex py-4 border-b border-gray-300 rounded-t-md justify-between items-center">
        <div className="flex gap-4 items-center">
          <Slack className="h-8 w-8 fill-black" />
          <span className="font-semibold text-lg">Channels</span>
        </div>
      </div>
      <div className="py-6">
        <SlackCardData organization={organization} />
      </div>
    </div>
  );
};

const SlackCardData: FC<SlackOverviewCardProps> = ({ organization }) => {
  const slackChannels = useSlackIntegrations(organization.orgId);

  if (slackChannels.isLoading) {
    return (
      <div>
        <div className="space-y-4">
          {Array.from(Array(3).keys()).map((num) => (
            <div
              key={num.toString()}
              className="flex flex-row animate-pulse p-4 rounded-md bg-gray-100 text-gray-100"
            >
              <div className="truncate">{num}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (slackChannels.isError) {
    return <ErrorCard message="Error loading your Slack integrations" />;
  }

  if (!slackChannels.data || slackChannels.data.length === 0) {
    return <SetupSlackCard organization={organization} />;
  }

  return (
    <div>
      <div className="space-y-2">
        {slackChannels.data.map((channel) => (
          <SlackIntegration
            key={`${channel.slackTeamId}-${channel.channelId}`}
            organizationId={organization.orgId}
            slackTeamName={channel.slackTeamName}
            slackTeamId={channel.slackTeamId}
            channelId={channel.channelId}
            channelName={channel.channelName}
          />
        ))}
      </div>
    </div>
  );
};
