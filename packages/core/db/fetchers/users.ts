import { Db } from "../../dynamodb";
import { User } from "../../dynamodb/entities/types";
import { UserResponse } from "../../github/endpointTypes";

/**
 * Fetches a user by their id
 */
export const fetchUserById = async (id: number): Promise<User | null> =>
  await Db.entities.user
    .get({ userId: id })
    .go()
    .then(({ data }) => data);

/**
 * Creates a user. Should only be used when logging in and the user doesn't exist
 */
export const insertUser = async (
  user: UserResponse,
  accessToken: string
): Promise<User> => {
  return await Db.entities.user
    .create({
      userId: user.id,
      name: user.login,
      email: user.email ?? undefined,
      ghAccessToken: accessToken,
      avatarUrl: user.avatar_url,
    })
    .go()
    .then(({ data }) => data);
};
