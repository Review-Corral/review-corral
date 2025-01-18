import { User } from "@core/dynamodb/entities/types";
import { assertVarExists } from "@core/utils/assert";
import { fetchUserById } from "@domain/dynamodb/fetchers/users";
import { Logger } from "@domain/logging";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { JwtPayload, verify } from "jsonwebtoken";

export const useUser = async (
  event: APIGatewayProxyEventV2,
  logger: Logger,
): Promise<{
  user: User | null;
  error: string | null;
}> => {
  const authToken = event.headers.authorization;

  if (!authToken) {
    logger.warn("No auth token found in request", { event });
    return { user: null, error: "No auth token found" };
  }

  let verifiedJwt: JwtPayload | string | null = null;

  try {
    verifiedJwt = verify(authToken, assertVarExists<string>("JWT_SECRET"));
  } catch (error) {
    logger.error("Error verifying JWT", { error });
    return { user: null, error: "Error verifying JWT" };
  }

  // Shouldn't happen
  if (typeof verifiedJwt !== "object" || !verifiedJwt) {
    logger.error("No verified JWT found", { verifiedJwt });
    return { user: null, error: "No verified JWT found" };
  }

  const { userId } = verifiedJwt as { userId: number };

  const user = await fetchUserById(userId);

  logger.info("Returned user", user);

  if (!user) return { user: null, error: "No user found in database" };

  return { user, error: null };
};
