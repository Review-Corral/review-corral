import { and, eq } from "drizzle-orm";
import { db } from "../client";
import { type NewOrganizationMember, organizationMembers, users } from "../schema";

// Member with user details joined
export type MemberWithUser = {
  orgId: number;
  userId: number;
  memberId: number; // Alias for userId for compatibility
  name: string;
  email: string | null;
  avatarUrl: string | null;
  slackId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Get all members for an organization with their user details
 */
export async function getOrganizationMembers(orgId: number): Promise<MemberWithUser[]> {
  const result = await db
    .select({
      orgId: organizationMembers.orgId,
      userId: organizationMembers.userId,
      slackId: organizationMembers.slackId,
      createdAt: organizationMembers.createdAt,
      updatedAt: organizationMembers.updatedAt,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(organizationMembers.userId, users.id))
    .where(eq(organizationMembers.orgId, orgId));

  return result.map((row) => ({
    ...row,
    memberId: row.userId,
    name: row.name ?? "",
  }));
}

/**
 * Get a specific member by orgId and userId
 */
export async function getOrgMember({
  orgId,
  userId,
}: {
  orgId: number;
  userId: number;
}): Promise<MemberWithUser | undefined> {
  const result = await db
    .select({
      orgId: organizationMembers.orgId,
      userId: organizationMembers.userId,
      slackId: organizationMembers.slackId,
      createdAt: organizationMembers.createdAt,
      updatedAt: organizationMembers.updatedAt,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(organizationMembers.userId, users.id))
    .where(
      and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.userId, userId)),
    );

  if (!result[0]) return undefined;

  return {
    ...result[0],
    memberId: result[0].userId,
    name: result[0].name ?? "",
  };
}

/**
 * Get a member by orgId and GitHub username (efficient query using user name index)
 */
export async function getOrgMemberByUsername({
  orgId,
  githubUsername,
}: {
  orgId: number;
  githubUsername: string;
}): Promise<MemberWithUser | undefined> {
  const result = await db
    .select({
      orgId: organizationMembers.orgId,
      userId: organizationMembers.userId,
      slackId: organizationMembers.slackId,
      createdAt: organizationMembers.createdAt,
      updatedAt: organizationMembers.updatedAt,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(organizationMembers.userId, users.id))
    .where(and(eq(organizationMembers.orgId, orgId), eq(users.name, githubUsername)));

  if (!result[0]) return undefined;

  return {
    ...result[0],
    memberId: result[0].userId,
    name: result[0].name ?? "",
  };
}

/**
 * Add a user as a member of an organization
 */
export async function addOrganizationMember(
  data: NewOrganizationMember,
): Promise<void> {
  await db.insert(organizationMembers).values(data).onConflictDoNothing();
}

/**
 * Batch add members to an organization
 */
export async function addOrganizationMembers(
  members: NewOrganizationMember[],
): Promise<void> {
  if (members.length === 0) return;
  await db.insert(organizationMembers).values(members).onConflictDoNothing();
}

/**
 * Update a member's slack ID
 */
export async function updateOrgMemberSlackId({
  orgId,
  userId,
  slackId,
}: {
  orgId: number;
  userId: number;
  slackId: string | null;
}): Promise<void> {
  await db
    .update(organizationMembers)
    .set({ slackId })
    .where(
      and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.userId, userId)),
    );
}
