import { and, eq, inArray } from "drizzle-orm";
import { db } from "../client";
import {
	type NewOrganization,
	type Organization,
	organizationMembers,
	organizations,
} from "../schema";

export async function getOrganization(
	orgId: number,
): Promise<Organization | undefined> {
	const result = await db
		.select()
		.from(organizations)
		.where(eq(organizations.id, orgId));
	return result[0];
}

export async function getOrganizationsByUser(
	userId: number,
): Promise<Organization[]> {
	const result = await db
		.select({
			id: organizations.id,
			name: organizations.name,
			avatarUrl: organizations.avatarUrl,
			billingEmail: organizations.billingEmail,
			installationId: organizations.installationId,
			type: organizations.type,
			stripeCustomerId: organizations.stripeCustomerId,
			stripeSubscriptionStatus: organizations.stripeSubscriptionStatus,
			createdAt: organizations.createdAt,
			updatedAt: organizations.updatedAt,
		})
		.from(organizations)
		.innerJoin(
			organizationMembers,
			eq(organizations.id, organizationMembers.orgId),
		)
		.where(eq(organizationMembers.userId, userId));
	return result;
}

export async function getOrganizationsBatch(
	orgIds: number[],
): Promise<Organization[]> {
	if (orgIds.length === 0) return [];
	const result = await db
		.select()
		.from(organizations)
		.where(inArray(organizations.id, orgIds));
	return result;
}

export async function createOrganization(
	data: NewOrganization,
): Promise<Organization> {
	const result = await db.insert(organizations).values(data).returning();
	return result[0];
}

export async function updateOrganization(
	orgId: number,
	data: Partial<Omit<NewOrganization, "id">>,
): Promise<Organization> {
	const result = await db
		.update(organizations)
		.set(data)
		.where(eq(organizations.id, orgId))
		.returning();
	return result[0];
}

export async function updateOrgInstallationId(
	orgId: number,
	installationId: number,
): Promise<Organization> {
	const result = await db
		.update(organizations)
		.set({ installationId })
		.where(eq(organizations.id, orgId))
		.returning();
	return result[0];
}

export async function updateOrgBillingDetails(
	orgId: number,
	billingEmail: string,
	customerId: string,
): Promise<Organization> {
	const result = await db
		.update(organizations)
		.set({
			billingEmail,
			stripeCustomerId: customerId,
		})
		.where(eq(organizations.id, orgId))
		.returning();
	return result[0];
}
