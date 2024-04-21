import { ErrorCard } from "@components/ui/cards/ErrorCard";
import { Loading } from "@components/ui/cards/loading";
import { FC } from "react";
import { useOrganizationMembers } from "../../useOrganizationMembers";
import { SharedLayout } from "../SharedLayout";
import { UsersTableForm } from "./UsersTableForm";
import { useSlackUsers } from "./useSlackUsers";

interface UsersTabProps {
  orgId: number;
}

export const UsersTab: FC<UsersTabProps> = ({ orgId }) => {
  const orgMembers = useOrganizationMembers(orgId);

  const slackInstallMembers = useSlackUsers(orgId);

  if (slackInstallMembers.isLoading || orgMembers.isLoading) {
    return <Loading text="Getting Slack integration users" />;
  }

  if (slackInstallMembers.error) {
    return <ErrorCard message="Error getting Slack integration users" />;
  }

  if (orgMembers.error) {
    return <ErrorCard message="Error getting Organization members" />;
  }

  if (
    !slackInstallMembers.data ||
    !slackInstallMembers.data ||
    slackInstallMembers.data.length < 1
  ) {
    return (
      <ErrorCard message="You haven't set up your Slack integration yet. Do that first to configure usernames" />
    );
  }

  return (
    <SharedLayout title="Users">
      {orgMembers.data && (
        <UsersTableForm data={orgMembers.data} slackUsers={slackInstallMembers.data} />
      )}
    </SharedLayout>
  );
};
