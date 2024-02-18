import { Db } from "../../dynamodb";

import {
  Organization,
  OrganizationInsertArgs,
  User,
} from "../../dynamodb/entities/types";
import { Logger } from "../../logging";
import { addOrganizationMember } from "./members";

const LOGGER = new Logger("fetchers.organizations");

/**
 * Fetches an organization by it's ID
 */
export const fetchOrganizationByAccountId = async (
  accountId: number
): Promise<Organization | null> =>
  await Db.entities.organization
    .get({ orgId: accountId })
    .go()
    .then(({ data }) => data);

/**
 * Creates a user. Should only be used when logging in and the user doesn't exist
 */
export const insertOrganization = async (
  args: OrganizationInsertArgs
): Promise<Organization> => {
  return await Db.entities.organization
    .create(args)
    .go()
    .then(({ data }) => data);
};

/**
 * Updates an organization with the new installation Id, if it's different. I don't know
 * for sure, but these may get out of a sync if the app is uninstalled and reinstalled
 * on the same organization.
 */
export const updateOrganizationInstallationId = async (args: {
  orgId: number;
  installationId: number;
}): Promise<void> => {
  await Db.entities.organization
    .patch({
      orgId: args.orgId,
    })
    .set({ installationId: args.installationId })
    .go();
};

/**
 * Get all of the organizations a user is currently mapped to
 */
export const fetchUsersOrganizations = async (
  userId: number
): Promise<Organization[]> => {
  const data = await Db.collections
    .usersOrgs({
      userId,
    })
    .go()
    .then(({ data }) => data);

  return data.organization;
};

// TODO: this is a duplicated method, remove
export const fetchOrganizationById = async (
  id: number
): Promise<Organization | null> => {
  return await fetchOrganizationByAccountId(id);
};

export const insertOrganizationAndAssociateUser = async ({
  user,
  createOrgArgs,
}: {
  user: User;
  createOrgArgs: OrganizationInsertArgs;
}) => {
  const org = await insertOrganization(createOrgArgs);
  await addOrganizationMember({ orgId: org.orgId, user });
  return org;
};
