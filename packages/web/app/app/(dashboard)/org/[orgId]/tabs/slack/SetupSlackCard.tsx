import { Organization } from "@core/dynamodb/entities/types";
import { FC } from "react";
import SetupSlackLink from "./SetupSlackLink";
import { Button } from "@/components/shadcn/button";

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
        <SetupSlackLink organizationId={organizationId}>
          <Button>Connect to Slack</Button>
        </SetupSlackLink>
      </div>
    </div>
  );
};
