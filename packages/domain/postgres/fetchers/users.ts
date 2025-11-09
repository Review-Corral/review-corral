import { eq } from "drizzle-orm";
import { UserResponse } from "../../github/endpointTypes";
import { db } from "../client";
import { type NewUser, type User, users } from "../schema";

/**
 * Fetches a user by their id
 */
export async function fetchUserById(id: number): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0] ?? null;
}

/**
 * Creates a user. Should only be used when logging in and the user doesn't exist
 */
export async function insertUser(
  user: Pick<UserResponse, "id" | "login" | "email" | "avatar_url">,
  accessToken: string | null,
): Promise<User> {
  const result = await db
    .insert(users)
    .values({
      id: user.id,
      name: user.login,
      email: user.email,
      ghAccessToken: accessToken,
      avatarUrl: user.avatar_url,
      status: "standard",
    })
    .returning();
  return result[0];
}

export async function updateUser(
  userId: number,
  data: Partial<Omit<NewUser, "id">>,
): Promise<User> {
  const result = await db
    .update(users)
    .set(data)
    .where(eq(users.id, userId))
    .returning();
  return result[0];
}
