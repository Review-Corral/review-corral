import { User } from "@core/dynamodb/entities/types";
import { fetchUserById } from "@core/dynamodb/fetchers/users";
import { useSession } from "sst/node/auth";

export const useUser = async (): Promise<{
  user: User | null;
  error: string | null;
}> => {
  const session = useSession();

  console.log("Session2", { session });

  if (session.type !== "user") {
    return { user: null, error: "User not set in session" };
  }

  const userId = session.properties.userId;

  console.log("Searching for user with UserId: ", userId);

  const user = await fetchUserById(userId);

  console.log("Returned user", user);

  if (!user) return { user: null, error: "No user found in database" };

  return { user, error: null };
};
