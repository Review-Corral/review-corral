import { ErrorCard } from "@components/ui/cards/ErrorCard";
import { WarningCard } from "@components/ui/cards/WarningCard";
import { Slack } from "lucide-react";
import { FC } from "react";
import { OrgViewProps } from "../shared";
import SlackButton from "./SetupSlackButton";
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
  const slackIntegrations = useSlackIntegrations(organization.id);

  if (slackIntegrations.isLoading) {
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

  if (slackIntegrations.isError) {
    return <ErrorCard message="Error loading your Slack integrations" />;
  }

  if (!slackIntegrations.data || slackIntegrations.data.length === 0) {
    return <SetupSlackCard organization={organization} />;
  }

  const hasOutdatedScopes = slackIntegrations.data.some(
    (slackIntegration) => !slackIntegration.isUpToDate,
  );

  return (
    <div>
      {hasOutdatedScopes && (
        <div className="mb-4">
          <WarningCard
            message="Your Slack scopes are out of date"
            subMessage={
              <div className="flex flex-col gap-2">
                <span>
                  Please update your Slack integration to continue receiving
                  notifications and utilize the latest features
                </span>
                <SlackButton
                  organizationId={organization.id}
                  buttonText="Update scopes"
                />
              </div>
            }
          />
        </div>
      )}
      <div className="space-y-2">
        {slackIntegrations.data.map((slackIntegration) => (
          <SlackIntegration
            key={`${slackIntegration.slackTeamId}-${slackIntegration.channelId}`}
            organizationId={organization.id}
            slackTeamName={slackIntegration.slackTeamName}
            slackTeamId={slackIntegration.slackTeamId}
            channelId={slackIntegration.channelId}
            channelName={slackIntegration.channelName}
          />
        ))}
      </div>
    </div>
  );
};
