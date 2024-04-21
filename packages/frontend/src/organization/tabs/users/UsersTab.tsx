import { FC } from "react";
import { useOrganizationMembers } from "../../useOrganizationMembers";
import { SharedLayout } from "../SharedLayout";
import { UsersTable } from "./UsersTable";
import { columns } from "./columns";

interface UsersTabProps {
  orgId: number;
}

export const UsersTab: FC<UsersTabProps> = ({ orgId }) => {
  const orgMembers = useOrganizationMembers(orgId);

  // TODO: enable this to automatically get Slack user IDs
  // const slackInstallMembers = useSlackUsers(orgId);

  return (
    <SharedLayout title="Users">
      {orgMembers.data && (
        <UsersTable data={orgMembers.data} columns={columns}></UsersTable>
      )}
    </SharedLayout>
  );
};
