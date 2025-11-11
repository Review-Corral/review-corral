import { Button } from "@components/shadcn/button";
import React from "react";

interface SlackButtonProps {
  organizationId: number;
}

const SlackButton: React.FC<SlackButtonProps> = ({ organizationId }) => {
  const slackBotId = import.meta.env.VITE_SLACK_BOT_ID;
  if (!slackBotId) {
    throw Error("VITE_SLACK_BOT_ID not set");
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    throw Error("VITE_API_URL not set");
  }

  const slackAuthUrl = `${apiUrl}/slack/oauth`;

  const searchParams = new URLSearchParams({
    state: organizationId.toString(),
    redirect_uri: slackAuthUrl,
    client_id: slackBotId,
    scope:
      "channels:join,chat:write,chat:write.public,im:write,incoming-webhook,users:read",
    user_scope: "",
  });

  // TODO: invalidate queries when launching this
  return (
    <div>
      <a href={`https://slack.com/oauth/v2/authorize?${searchParams.toString()}`}>
        <Button>Connect to Slack</Button>
      </a>
    </div>
  );
};

export default SlackButton;
