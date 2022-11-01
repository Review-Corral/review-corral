import { FC } from "react";
import { OrgMember } from "../../../../github-api-types";
import { UsernameMapping } from "./useGetUsernameMappings";

export interface MemberWithMapping extends OrgMember {
  mapping?: UsernameMapping;
}

interface UsernameMappingsProps {
  organizationId: string;
}

export const UsernameMappings: FC<UsernameMappingsProps> = ({
  organizationId,
}) => {
  // const usernameMappings = useGetUsernameMappings(teamId);
  // const members = useGetMembers(organizationId);

  return <div>Hello</div>;

  // if (members.isLoading || usernameMappings.isLoading) {
  //   return <span>Loading members...</span>;
  // }

  // if (members.error) {
  //   return <ErrorAlert message="Error getting members" />;
  // }

  // if (usernameMappings.error) {
  //   return <ErrorAlert message="Error getting user mappings" />;
  // }

  // if (!members.data) {
  //   throw Error("Failed to fetch members");
  // }

  // if (!usernameMappings.data) {
  //   throw Error("Failed to fetch username mappings");
  // }

  // const membersWithMappings = members.data.map<MemberWithMapping>((member) => {
  //   const mapping = usernameMappings.data!.find(
  //     (mapping) => mapping.github_username === member.login,
  //   );

  //   return {
  //     ...member,
  //     mapping,
  //   };
  // });

  // return (
  //   <div>
  //     <UsernameMappingsTable members={membersWithMappings} />
  //   </div>
  // );
};
