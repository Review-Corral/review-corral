import { FC } from "react";
import { ErrorAlert } from "../../common/alerts/Error";
import { Header, OrgViewProps } from "../shared";
import { useGetMembers } from "./useGetOrganizationMembers";
import {
  MemberWithMapping,
  UsernameMappingsTable,
} from "./UsernameMappingsTable";
import { useGetUsernameMappings } from "./useUsernameMappings";

export const UsernamesTab: FC<OrgViewProps> = ({
  organization: { id: organizationId },
}) => {
  const usernameMappings = useGetUsernameMappings(organizationId);
  const members = useGetMembers(organizationId);

  if (members.error) {
    return <ErrorAlert message="Error getting members" />;
  }

  if (usernameMappings.error) {
    return <ErrorAlert message="Error getting user mappings" />;
  }

  const membersWithMappings =
    members.data?.map<MemberWithMapping>((member) => {
      const mapping = usernameMappings.data!.find(
        (mapping) => mapping.github_username === member.login,
      );

      return {
        ...member,
        mapping,
      };
    }) ?? [];

  return (
    <div>
      <Header>Username mappings</Header>
      <p className="mt-2 text-sm text-gray-700 max-w-4xl">
        Add the Slack &quot;member Id&quot;s for the users in your Github
        organization. This will allow the bot to reference the Slack username
        from the Github events.
      </p>
      <UsernameMappingsTable
        isLoading={usernameMappings.isLoading || members.isLoading}
        members={membersWithMappings}
        organizationId={organizationId}
      />
    </div>
  );
};
