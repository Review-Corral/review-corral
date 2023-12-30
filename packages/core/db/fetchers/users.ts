import { Endpoints } from "@octokit/types";
import { eq } from "drizzle-orm";
import { DB } from "../db";
import { users } from "../schema";
import { User } from "../types";
import { takeFirst, takeFirstOrThrow } from "./utils";

export type UserResponse = Endpoints["GET /user"]["response"]["data"];

/**
 * Fetches a user by their id
 */
export const fetchUserById = async (id: number): Promise<User | undefined> =>
  await DB.select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
    .then(takeFirst);

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
