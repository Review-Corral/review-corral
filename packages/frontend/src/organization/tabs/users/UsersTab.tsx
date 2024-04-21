import { FC } from "react";
import { useOrganizationMembers } from "../../useOrganizationMembers";
import { SharedLayout } from "../SharedLayout";
import { UsersTableForm } from "./UsersTableForm";

interface UsersTabProps {
  orgId: number;
}

export const UsersTab: FC<UsersTabProps> = ({ orgId }) => {
  const orgMembers = useOrganizationMembers(orgId);

  // TODO: enable this to automatically get Slack user IDs
  // const slackInstallMembers = useSlackUsers(orgId);

  return (
    <SharedLayout title="Users">
      {orgMembers.data && <UsersTableForm data={orgMembers.data} />}
    </SharedLayout>
  );
};
