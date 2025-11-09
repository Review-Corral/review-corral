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
 * Update a subscription
 */
export async function updateSubscription({
  customerId,
  subscriptionId,
  ...updates
}: Partial<Omit<NewSubscription, "customerId" | "subscriptionId">> & {
  customerId: string;
  subscriptionId: string;
}): Promise<Subscription> {
  const result = await db
    .update(subscriptions)
    .set(updates)
    .where(
      and(
        eq(subscriptions.customerId, customerId),
        eq(subscriptions.subscriptionId, subscriptionId),
      ),
    )
    .returning();

  if (!result[0]) {
    throw new Error(
      `Subscription not found for customerId: ${customerId} and subscriptionId: ${subscriptionId}`,
    );
  }

  return result[0];
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
