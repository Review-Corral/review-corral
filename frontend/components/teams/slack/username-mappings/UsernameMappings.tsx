import { FC } from "react";
import { ErrorAlert } from "../../../common/alerts/Error";
import { OrgMember, useGetMembers } from "./useGetMembers";
import {
  useGetUsernameMappings,
  UsernameMapping,
} from "./useGetUsernameMappings";
import { UsernameMappingsTable } from "./UsernameMappingsTable";

export interface MemberWithMapping extends OrgMember {
  mapping?: UsernameMapping;
}

interface UsernameMappingsProps {
  teamId: string;
}

export const UsernameMappings: FC<UsernameMappingsProps> = ({ teamId }) => {
  const usernameMappings = useGetUsernameMappings(teamId);
  const members = useGetMembers();

  if (members.isLoading || usernameMappings.isLoading) {
    return <span>Loading members...</span>;
  }

  if (members.error) {
    return <ErrorAlert message="Error getting members" />;
  }

  if (usernameMappings.error) {
    return <ErrorAlert message="Error getting user mappings" />;
  }

  if (!members.data) {
    throw Error("Failed to fetch members");
  }

  if (!usernameMappings.data) {
    throw Error("Failed to fetch username mappings");
  }

  const membersWithMappings = members.data.map<MemberWithMapping>((member) => {
    const mapping = usernameMappings.data!.find(
      (mapping) => mapping.github_username === member.login,
    );

    return {
      ...member,
      mapping,
    };
  });

  return (
    <div>
      <UsernameMappingsTable members={membersWithMappings} />
    </div>
  );
};
