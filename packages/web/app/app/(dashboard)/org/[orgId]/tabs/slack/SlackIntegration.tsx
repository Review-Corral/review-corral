import { Loading } from "@components/ui/cards/loading";
import { FC } from "react";
import SlackButton from "./SetupSlackButton";
import { useSlackIntegrations } from "./useSlackIntegrations";
import { DeleteIcon } from "lucide-react";

interface SlackIntegration {
  organizationId: number;
  slackTeamId: string;
  slackTeamName: string;
  channelId: string;
  channelName: string;
}

export const SlackIntegration: FC<SlackIntegration> = ({
  organizationId,
  slackTeamId,
  slackTeamName,
  channelId,
  channelName,
}) => {
  return (
    <div
      className="border border-gray-200 rounded-md p-4 truncate"
      id="slack-channel"
      key={`${slackTeamId}-${channelId}`}
    >
      <div className="flex justify-between" key={slackTeamId}>
        <div key={`${slackTeamId}-${channelId}`} className="flex flex-row">
          <span className="text-gray-400 mr-2">{slackTeamName}</span>
          {channelName}
        </div>

        <div className="group flex items-center cursor-pointer p-1 hover:bg-red-100 rounded-md">
          <DeleteIcon className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
        </div>
      </div>
    </div>
  );
};
