import { Button } from "@/components/shadcn/button";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import React from "react";

interface SlackButtonProps {
  organizationId: number;
}

const SlackButton: React.FC<SlackButtonProps> = ({ organizationId }) => {
  // biome-ignore lint/correctness/noUnusedVariables: <explanation>
  const queryClient = useQueryClient();

  const slackBotId = process.env.NEXT_PUBLIC_SLACK_BOT_ID;
  if (!slackBotId) {
    throw Error("NEXT_PUBLIC_SLACK_BOT_ID not set");
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw Error("NEXT_PUBLIC_API_URL not set");
  }

  const slackAuthUrl = `${apiUrl}/slack/oauth`;

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
        onClick={() => {
          // TODO:
          // queryClient.invalidateQueries([]);
        }}
      >
        <Button>Connect to Slack</Button>
      </Link>
    </div>
  );
};

export default SlackButton;
