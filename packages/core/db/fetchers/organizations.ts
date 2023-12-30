import { eq } from "drizzle-orm";
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
  DB.insert(usersAndOrganizations).values({
    id: `${user.id}-${organization.id}`,
    userId: user.id,
    orgId: organization.id,
  });
};
