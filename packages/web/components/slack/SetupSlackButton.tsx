import { assertVarExists } from "@core/utils/assert";
import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";

interface SlackButtonProps {
  organizationId: number;
}

const SlackButton: React.FC<SlackButtonProps> = ({ organizationId }) => {
  const slackBotId = assertVarExists("NEXT_PUBLIC_SLACK_BOT_ID");
  const slackAuthUrl = assertVarExists("NEXT_PUBLIC_SLACK_AUTH_URL");

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
        href={`https://slack.com/oauth/v2/authorize?${searchParams.toString()}`}
      >
        <Button>Connect to Slack</Button>
      </Link>
    </div>
  );
};

export default SlackButton;
