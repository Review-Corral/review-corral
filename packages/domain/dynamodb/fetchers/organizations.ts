import { Db } from "../client";

import {
  Organization,
  OrganizationInsertArgs,
  User,
} from "@core/dynamodb/entities/types";
import { Logger } from "../../logging";
import { addOrganizationMemberFromUser } from "./members";

const LOGGER = new Logger("fetchers.organizations");

/**
 * Fetches an organization by it's ID
 */
export const fetchOrganizationByAccountId = async (
  accountId: number,
): Promise<Organization | null> =>
  await Db.entities.organization.query
    .primary({ orgId: accountId })
    .go()
    .then(({ data }) => (data.length > 0 ? data[0] : null));

export const fetchOrganizationByStripeCustomerId = async (
  stripeCustomerId: string,
): Promise<Organization | null> => {
  const organizationsWithCustomerId = await Db.entities.organization
    .match({ customerId: stripeCustomerId })
    .go()
    .then(({ data }) => data);

  if (organizationsWithCustomerId.length === 0) {
    return null;
  }

  if (organizationsWithCustomerId.length > 1) {
    LOGGER.error(
      `Found multiple organizations with the same stripeCustomerId: ${stripeCustomerId}`,
    );
    return null;
  }

  return organizationsWithCustomerId[0];
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

/**
 * Updates the Stripe billing attributes for an organization
 */
type UpdateOrgStripeSubscriptionArgs =
  | {
      customerId: string;
      subId: string;
      priceId: string;
      status: string;
    }
  | {
      status: string;
    };

export const updateOrgStripeSubscription = async ({
  orgId,
  ...stripeArgs
}: {
  orgId: number;
} & UpdateOrgStripeSubscriptionArgs) => {
  return await Db.entities.organization.patch({ orgId }).set(stripeArgs).go();
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

export const updateOrgCustomerId = async ({
  customerId,
  orgId,
}: {
  customerId: string;
  orgId: number;
}) => {
  return await Db.entities.organization
    .patch({ orgId })
    .set({ customerId: customerId })
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

// TODO: this is a duplicated method, remove
export const fetchOrganizationById = async (
  id: number,
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
  await addOrganizationMemberFromUser({ orgId: org.orgId, user });
  return org;
};
