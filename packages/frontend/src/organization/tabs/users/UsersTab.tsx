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
  return (
    <SharedLayout title="Users">
      <div className="flex flex-col gap-12 w-full">
        <div className="max-w-[40rem] flex flex-col gap-4 text-md text-gray-700">
          <p>
            Use this table to map your Github Users with your Slack users so that Review
            Corral can properly notify the correct users in Slack on Github events.
          </p>
        </div>
        <UsersTabData orgId={orgId} />
      </div>
    </SharedLayout>
  );
};

export const UsersTabData: FC<UsersTabProps> = ({ orgId }) => {
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
    <>
      {orgMembers.data && (
        <UsersTableForm data={orgMembers.data} slackUsers={slackInstallMembers.data} />
      )}
    </>
  );
};
