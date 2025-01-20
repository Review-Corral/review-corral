import { User } from "@core/dynamodb/entities/types";
import { assertVarExists } from "@core/utils/assert";
import { fetchUserById } from "@domain/dynamodb/fetchers/users";
import { Logger } from "@domain/logging";
import { APIGatewayProxyEvent } from "aws-lambda";
import { JwtPayload, verify } from "jsonwebtoken";

export const useUser = async (
  event: APIGatewayProxyEvent,
  logger: Logger,
): Promise<{
  user: User | null;
  error: string | null;
}> => {
  const authHeader = event.headers.authorization;

  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    logger.warn("No auth token found in request", { event });
    return { user: null, error: "No auth token found" };
  }

  const authToken = event.headers.authorization?.split(" ")[1];
  const jwtSecret = assertVarExists<string>("JWT_SECRET");

  logger.info("Getting user from auth token", { authToken });

  if (!authToken) {
    logger.warn("No auth token found in request", { event });
    return { user: null, error: "No auth token found" };
  }

  let verifiedJwt: JwtPayload | string | null = null;

  try {
    verifiedJwt = verify(authToken, jwtSecret);
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

  logger.info("Found userId", { userId });

  const user = await fetchUserById(userId);

  logger.info("Returned user", user);

  if (!user) return { user: null, error: "No user found in database" };

  return { user, error: null };
};
