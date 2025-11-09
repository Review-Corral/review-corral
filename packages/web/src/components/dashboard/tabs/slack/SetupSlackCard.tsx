import { Organization } from "@core/apiTypes";
import { FC } from "react";
import SlackButton from "./SetupSlackButton";

interface SetupSlackCardProps {
  organization: Organization;
}

export const SetupSlackCard: FC<SetupSlackCardProps> = ({
  organization: { orgId: organizationId },
}) => {
  return (
    <div className="p-4 border border-grey-200 rounded-md space-y-6 max-w-xl">
      <span>
        Setup your slack integration below to enable sending events to the Slack channel
        of your choosing.
      </span>
      <div>
        <SlackButton organizationId={organizationId} />
      </div>
    </div>
  );
};
