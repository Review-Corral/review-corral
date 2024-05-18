import { Db } from "../client";

import {
  Organization,
  OrganizationInsertArgs,
  OrganizationUpdateArgs,
  User,
} from "@core/dynamodb/entities/types";
import { Logger } from "../../logging";
import { addOrganizationMemberFromUser } from "./members";

const LOGGER = new Logger("fetchers.organizations");

/**
 * Fetches an organization by it's ID
 */
export const fetchOrganizationById = async (
  id: number,
): Promise<Organization | null> => {
  return await fetchOrganizationById(id);
};

/**
 * Creates a user. Should only be used when logging in and the user doesn't exist
 */
export const insertOrganization = async (
  args: OrganizationInsertArgs,
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

export const updateOrganization = async ({
  orgId,
  ...updateArgs
}: OrganizationUpdateArgs & { orgId: number }): Promise<void> => {
  await Db.entities.organization
    .patch({
      orgId: orgId,
    })
    .set(updateArgs)
    .go();
};

export const updateOrgBillingEmail = async ({
  newEmail,
  orgId,
}: {
  newEmail: string;
  orgId: number;
}) => {
  return await Db.entities.organization
    .patch({ orgId })
    .set({ billingEmail: newEmail })
    .go();
};

/**
 * Get all of the organizations a user is currently mapped to
 */
export const fetchUsersOrganizations = async (
  userId: number,
): Promise<Organization[]> => {
  const memberInOrgs = await Db.entities.member.query
    .membersOrgs({
      memberId: userId,
    })
    .go()
    .then(({ data }) => data);

  const orgs = await Db.entities.organization
    .get(memberInOrgs.map((m) => ({ orgId: m.orgId })))
    .go()
    .then(({ data }) => data);

  return orgs;
};



export const insertOrganizationAndAssociateUser = async ({
  user,
  createOrgArgs,
}: {
  user: User;
  createOrgArgs: OrganizationInsertArgs;
}) => {
  const org = await insertOrganization(createOrgArgs);
  await addOrganizationMemberFromUser({ orgId: org.orgId, user });
  return org;
};
