import { Button } from "@components/ui/button";
import React from "react";
import { useQueryClient } from "react-query";
import { Link } from "react-router-dom";

interface SlackButtonProps {
  organizationId: number;
}

const SlackButton: React.FC<SlackButtonProps> = ({ organizationId }) => {
  const queryClient = useQueryClient();

  const slackBotId = import.meta.env.VITE_SLACK_BOT_ID;
  const slackAuthUrl = import.meta.env.VITE_SLACK_AUTH_URL;
  if (!slackBotId) {
    throw Error("VITE_SLACK_BOT_ID not set");
  }
  if (!slackAuthUrl) {
    throw Error("VITE_SLACK_AUTH_URL not set");
  }

  const searchParams = new URLSearchParams({
    state: organizationId.toString(),
    redirect_uri: slackAuthUrl,
    client_id: slackBotId,
    scope:
      "channels:history,chat:write,commands,groups:history,incoming-webhook,users:read",
    user_scope: "",
  });

  return (
    <div>
      <Link
        to={`https://slack.com/oauth/v2/authorize?${searchParams.toString()}`}
        onClick={() => {
          // TODO:
          queryClient.invalidateQueries([]);
        }}
      >
        <Button>Connect to Slack</Button>
      </Link>
    </div>
  );
};

export default SlackButton;
