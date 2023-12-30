import { eq } from "drizzle-orm";
import { UserResponse } from "../../github/endpointTypes";
import { DB } from "../db";
import { users } from "../schema";
import { User } from "../types";
import { takeFirst, takeFirstOrThrow } from "./utils";

/**
 * Fetches a user by their id
 */
export const fetchUserById = async (id: number): Promise<User | undefined> =>
  await DB.select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
    .then(takeFirst);

/**
 * Creates a user. Should only be used when logging in and the user doesn't exist
 */
export const insertUser = async (
  user: UserResponse,
  accessToken: string
): Promise<User> => {
  return await DB.insert(users)
    .values({
      id: user.id,
      email: user.email,
      ghAccessToken: accessToken,
    })
    .returning()
    .then(takeFirstOrThrow);
};
