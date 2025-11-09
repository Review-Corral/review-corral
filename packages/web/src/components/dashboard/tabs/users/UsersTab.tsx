import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import { ErrorCard } from "@components/ui/cards/ErrorCard";
import { Loading } from "@components/ui/cards/loading";
import { Organization } from "@core/dynamodb/entities/types";
import { FC } from "react";
import { SharedLayout } from "../SharedLayout";
import SlackButton from "../slack/SetupSlackButton";
import { useSlackIntegrations } from "../slack/useSlackIntegrations";
import { UsersTableForm } from "./UsersTableForm";
import { useSlackUsers } from "./useSlackUsers";

interface UsersTabProps {
  organization: Organization;
}

export const UsersTab: FC<UsersTabProps> = ({ organization }) => {
  const slackIntegrations = useSlackIntegrations(organization.orgId);
  const isLoading = slackIntegrations.isLoading;

  const hasSlackIntegrations =
    slackIntegrations.data?.length && slackIntegrations.data.length > 0;

  const innnerContent = () => {
    if (hasSlackIntegrations) return <UsersTabData organization={organization} />;
    if (isLoading) return <Loading />;
    if (!hasSlackIntegrations)
      return (
        <div className="mt-4 p-6 rounded-lg border border-red-200 bg-red-50">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-medium text-red-800">
              No Slack Integration Found
            </h3>
            <p className="text-red-700">You don't have any Slack integrations set up</p>
            <SlackButton organizationId={organization.orgId} />
          </div>
        </div>
      );
  };

  return (
    <SharedLayout title="Users">
      <div className="flex flex-col gap-8 w-full">
        <div className="max-w-160 flex flex-col gap-4 text-md text-gray-700">
          <p>
            Use this table to map your Github Users with your Slack users so that Review
            Corral can properly notify the correct users in Slack on Github events.
          </p>
        </div>
        {innnerContent()}
      </div>
    </SharedLayout>
  );
};

export const UsersTabData: FC<UsersTabProps> = ({ organization }) => {
  const orgMembers = useOrganizationMembers(organization.orgId);
  const slackInstallMembers = useSlackUsers(organization.orgId);

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
        <UsersTableForm
          orgId={organization.orgId}
          data={orgMembers.data}
          slackUsers={slackInstallMembers.data}
        />
      )}
    </>
  );
};
