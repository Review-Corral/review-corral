import { eq, getTableColumns } from "drizzle-orm";
import { DB } from "../db";
import { organizations, usersAndOrganizations } from "../schema";
import { Organization, OrganizationInsertArgs, User } from "../types";
import { takeFirst, takeFirstOrThrow } from "./utils";

/**
 * Fetches a user by their id
 */
export const fetchOrganizationByAccountId = async (
  accountId: number
): Promise<Organization | undefined> =>
  await DB.select()
    .from(organizations)
    .where(eq(organizations.id, accountId))
    .limit(1)
    .then(takeFirst);

/**
 * Creates a user. Should only be used when logging in and the user doesn't exist
 */
export const insertOrganization = async (
  args: OrganizationInsertArgs
): Promise<Organization> => {
  return await DB.insert(organizations)
    .values(args)
    .returning()
    .then(takeFirstOrThrow);
};

/**
 * Updates an organization with the new installation Id, if it's different. I don't know
 * for sure, but these may get out of a sync if the app is uninstalled and reinstalled
 * on the same organization.
 */
export const updateOrganizationInstallationId = async (
  args: Pick<OrganizationInsertArgs, "installationId" | "id">
): Promise<Organization> => {
  return await DB.update(organizations)
    .set({
      installationId: args.installationId,
    })
    .where(eq(organizations.id, args.id))
    .returning()
    .then(takeFirstOrThrow);
};

/**
 * Get all of the organizations a user is currently mapped to
 */
export const fetchUsersOrganizations = async (
  userId: number
): Promise<Organization[]> => {
  return await DB.select(getTableColumns(organizations))
    .from(organizations)
    .innerJoin(
      usersAndOrganizations,
      eq(organizations.id, usersAndOrganizations.orgId)
    )
    .where(eq(usersAndOrganizations.userId, userId));
};

export const fetchOrganizationById = async (
  id: number
): Promise<Organization | undefined> =>
  await DB.select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1)
    .then(takeFirst);

export const insertOrganizationAndAssociateUser = async (
  args: OrganizationInsertArgs,
  user: User
): Promise<Organization> => {
  const organization = await insertOrganization(args);
  associateOrganizationWithUser(organization, user);

  return organization;
};

export const associateOrganizationWithUser = async (
  organization: Organization,
  user: User
) => {
  return await DB.insert(usersAndOrganizations)
    .values({
      id: `${user.id}-${organization.id}`,
      userId: user.id,
      orgId: organization.id,
    })
    .returning();
};
