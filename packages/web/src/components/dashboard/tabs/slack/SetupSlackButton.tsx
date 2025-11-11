import { Button } from "@components/shadcn/button";
import React from "react";
import { getSlackInstallUrl } from "./getSlackInstallUrl";

interface SlackButtonProps {
  organizationId: number;
  buttonText?: string;
}

const SlackButton: React.FC<SlackButtonProps> = ({
  organizationId,
  buttonText = "Connect to Slack",
}) => {
  // TODO: invalidate queries when launching this
  // NOTE: we do invalidate on the success redirect route
  return (
    <div>
      <a href={getSlackInstallUrl(organizationId)}>
        <Button variant="outline">{buttonText}</Button>
      </a>
    </div>
  );
};

export default SlackButton;
