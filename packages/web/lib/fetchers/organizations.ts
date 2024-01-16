import { AuthedUser } from "@/app/dashboard/userActions";
import { Organization, Repository } from "@core/db/types";
import { kyGet } from "./shared";

export const useOrganizations = async (user: AuthedUser) =>
  await kyGet<Organization[]>(`/gh/installations`, user);

export const useOrganization = async (orgId: number, user: AuthedUser) => {
  const organizations = await useOrganizations(user);
  const organization = organizations.find((org) => org.id === orgId);

  if (!organization) {
    throw new Error(`Organization ${orgId} not found`);
  }

  return organization;
};

export const useRepositories = async (user: AuthedUser, orgId: number) =>
  await kyGet<Repository[]>(`/gh/installations/${orgId}/repositories`, user);
