import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import React, { PropsWithChildren } from "react";
import { SLACK_INTEGRATIONS_QUERY_KEY } from "./useSlackIntegrations";

interface SlackButtonProps {
  organizationId: number;
}

const SetupSlackLink: React.FC<PropsWithChildren<SlackButtonProps>> = ({
  organizationId,
  children,
}) => {
  const queryClient = useQueryClient();

  const slackBotId = process.env.NEXT_PUBLIC_SLACK_BOT_ID;
  const slackAuthUrl = process.env.NEXT_PUBLIC_SLACK_AUTH_URL;
  if (!slackBotId) {
    throw Error("NEXT_PUBLIC_SLACK_BOT_ID not set");
  }
  if (!slackAuthUrl) {
    throw Error("NEXT_PUBLIC_SLACK_AUTH_URL not set");
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
        href={`https://slack.com/oauth/v2/authorize?${searchParams.toString()}`}
        onClick={() => {
          queryClient.invalidateQueries({
            queryKey: [SLACK_INTEGRATIONS_QUERY_KEY],
          });
        }}
      >
        {children}
      </Link>
    </div>
  );
};

export default SetupSlackLink;
