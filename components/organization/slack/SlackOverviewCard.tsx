import { FC } from "react";
import { Slack } from "../../assets/icons/Slack";
import { ErrorAlert } from "../../common/alerts/Error";
import { Organization } from "../shared";
import { useSlackIntegrations } from "./useSlackIntegrations";

interface SlackOverviewCardProps {
  organization: Organization;
  onEdit: () => void;
}

export const SlackOverviewCard: FC<SlackOverviewCardProps> = ({
  organization,
  onEdit,
}) => {
  return (
    <div id="github">
      <div className="flex py-4 border-b border-gray-300 rounded-t-md justify-between items-center w-96">
        <div className="flex gap-4 items-center">
          <Slack className="h-8 w-8 fill-black" />
          <span className="font-semibold text-lg">Channels</span>
        </div>
        {/* <div
          className="cursor-pointer underline text-indigo-500 underline-offset-2"
          onClick={() => onEdit()}
        >
          Edit
        </div> */}
      </div>
      <div className="py-6">
        <SlackCardData organization={organization} onEdit={onEdit} />
      </div>
    </div>
  );
};

const SlackCardData: FC<SlackOverviewCardProps> = ({
  organization,
  onEdit,
}) => {
  const slackChannels = useSlackIntegrations({
    organizationId: organization.id,
  });

  if (slackChannels.isLoading) {
    return (
      <div>
        <div className="space-y-4">
          {Array.from(Array(3).keys()).map((num) => (
            <div
              key={num}
              className="h-6 w-full rounded-lg bg-gray-200 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (slackChannels.isError) {
    return <ErrorAlert message="Error loading your Slack integrations" />;
  }

  if (!slackChannels.data || slackChannels.data.length === 0) {
    return <ErrorAlert message="You need to setup your integration!" />;
  }

  return (
    <div>
      <div className="space-y-2">
        {slackChannels.data.map((channel) => (
          <div
            className="border border-gray-200 rounded-md p-4"
            id="slack-channel"
            key={channel.id}
          >
            <span className="text-gray-400 mr-2">
              {channel.slack_team_name}
            </span>
            {channel.channel_name}
          </div>
        ))}
      </div>
    </div>
  );
};
