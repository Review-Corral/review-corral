import { FC } from "react";
import { useOrganizationMembers } from "../useOrganizationMembers";
import { SharedLayout } from "./SharedLayout";

interface UsersTabProps {
  orgId: number;
}

export const UsersTab: FC<UsersTabProps> = ({ orgId }) => {
  const orgMembers = useOrganizationMembers(orgId);

  return <SharedLayout title="Users">{JSON.stringify(orgMembers)}</SharedLayout>;
};
