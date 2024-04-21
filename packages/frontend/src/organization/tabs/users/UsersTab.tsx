import { ErrorCard } from "@components/ui/cards/ErrorCard";
import { Loader2Icon } from "lucide-react";
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
    return (
      <div className="flex gap-2 items-center">
        <Loader2Icon className="animate-spin h-5 w-5 black" />
        <span>Loading...</span>
      </div>
    );
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
