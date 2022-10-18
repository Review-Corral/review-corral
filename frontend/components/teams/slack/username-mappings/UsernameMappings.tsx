import { FC } from "react";
import { ErrorAlert } from "../../../common/alerts/Error";
import { useGetMembers } from "./useGetMembers";
import { useGetUsernameMappings } from "./useGetUsernameMappings";
import { UsernameMappingsTable } from "./UsernameMappingsTable";

interface UsernameMappingsProps {
  teamId: string;
}

export const UsernameMappings: FC<UsernameMappingsProps> = ({ teamId }) => {
  const usernameMappings = useGetUsernameMappings(teamId);
  const members = useGetMembers();

  if (members.isLoading) {
    return <span>Loading members...</span>;
  }

  if (members.error) {
    return <ErrorAlert message="Error getting members" />;
  }

  return (
    <div>
      <UsernameMappingsTable members={members.data!} />
    </div>
  );
};
