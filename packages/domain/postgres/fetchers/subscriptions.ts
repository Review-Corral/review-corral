import { and, eq } from "drizzle-orm";
import { db } from "../client";
import { type NewSubscription, type Subscription, subscriptions } from "../schema";

/**
 * Get all subscriptions for a customer
 */
export async function fetchSubscriptionsByCustomerId(
  customerId: string,
): Promise<Subscription[]> {
  return await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.customerId, customerId));
}

/**
 * Get all subscriptions for an organization
 */
export async function fetchSubscriptionsByOrgId(
  orgId: number,
): Promise<Subscription[]> {
  return await db.select().from(subscriptions).where(eq(subscriptions.orgId, orgId));
}

/**
 * Get a specific subscription by customer ID and subscription ID
 */
export async function fetchSubscription({
  customerId,
  subscriptionId,
}: {
  customerId: string;
  subscriptionId: string;
}): Promise<Subscription | null> {
  const result = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.customerId, customerId),
        eq(subscriptions.subscriptionId, subscriptionId),
      ),
    );

  return result[0] ?? null;
}

/**
 * Create a new subscription
 */
export async function insertSubscription(data: NewSubscription): Promise<Subscription> {
  const result = await db.insert(subscriptions).values(data).returning();
  return result[0];
}

/**
 * Update subscription status and priceId by customerId + subscriptionId.
 * Returns the updated subscription if found, or null if subscription doesn't exist.
 * This is used by webhook handlers that don't have orgId available.
 */
export async function updateSubscriptionStatus({
  customerId,
  subscriptionId,
  status,
  priceId,
}: {
  customerId: string;
  subscriptionId: string;
  status: string;
  priceId: string;
}): Promise<Subscription | null> {
  const result = await db
    .update(subscriptions)
    .set({ status, priceId, updatedAt: new Date() })
    .where(
      and(
        eq(subscriptions.customerId, customerId),
        eq(subscriptions.subscriptionId, subscriptionId),
      ),
    )
    .returning();

  return result[0] ?? null;
}

/**
 * Upsert a subscription (insert or update)
 */
export async function upsertSubscription(data: NewSubscription): Promise<void> {
  await db
    .insert(subscriptions)
    .values(data)
    .onConflictDoUpdate({
      target: [subscriptions.customerId, subscriptions.subscriptionId],
      set: {
        priceId: data.priceId,
        status: data.status,
        updatedAt: new Date(),
      },
    });
}
