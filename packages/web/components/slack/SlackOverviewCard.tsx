"use server";

import { OrgViewProps } from "@/app/dashboard/org/[orgId]/shared";
import { fetchSlackIntegrations } from "@/lib/fetchers/organizations";
import { SetupSlackCard } from "./SetupSlackCard";

export async function SlackOverviewCard({ organization }: OrgViewProps) {
  const slackChannels = await fetchSlackIntegrations(organization.id);

  if (slackChannels.length === 0) {
    return <SetupSlackCard organization={organization} />;
  } else {
    return (
      <div>
        <div className="space-y-2">
          {slackChannels.map((channel) => (
            <div
              className="border border-gray-200 rounded-md p-4 truncate"
              id="slack-channel"
              key={`${channel.slackTeamId}-${channel.channelId}`}
            >
              <span className="text-gray-400 mr-2">
                {channel.slackTeamName}
              </span>
              {channel.channelName}
            </div>
          ))}
        </div>
      </div>
    );
  }
}
