"use server";

import { OrgViewProps } from "@/app/dashboard/org/[orgId]/shared";
import { fetchSlackRepositories } from "@/lib/fetchers/organizations";
import { Slack } from "lucide-react";
import { SetupSlackCard } from "./SetupSlackCard";

export async function SlackOverviewCard({ organization }: OrgViewProps) {
  return (
    <div id="slack" className="w-96">
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
}

const SlackCardData = async ({ organization }: OrgViewProps) => {
  const slackChannels = await fetchSlackRepositories(organization.id);

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
};
