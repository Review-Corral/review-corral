import { User } from "@core/dynamodb/entities/types";
import { fetchUserById } from "@domain/dynamodb/fetchers/users";
import { Logger } from "@domain/logging";
import { MiddlewareHandler } from "hono";
import { JwtPayload, verify } from "jsonwebtoken";
import { Resource } from "sst";

const LOGGER = new Logger("middleware:auth");

// Define the user type for the Hono environment
declare module "hono" {
  interface ContextVariableMap {
    user: User | null;
    userError: string | null;
  }
}

// Create auth middleware for Hono
export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const event = c.env.awsGateway;

  if (!event) {
    LOGGER.error("No API Gateway event found");
    c.set("user", null);
    c.set("userError", "No API Gateway event found");
    await next();
    return;
  }

  const authHeader = event.headers.authorization;

  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    LOGGER.warn("No auth token found in request");
    c.set("user", null);
    c.set("userError", "No auth token found");
    await next();
    return;
  }

  const authToken = authHeader.split(" ")[1];
  const jwtSecret = Resource.JWT_SECRET.value;

  LOGGER.info("Getting user from auth token");

  if (!authToken) {
    LOGGER.warn("No auth token found in request");
    c.set("user", null);
    c.set("userError", "No auth token found");
    await next();
    return;
  }

  let verifiedJwt: JwtPayload | string | null = null;

  try {
    verifiedJwt = verify(authToken, jwtSecret);
  } catch (error) {
    LOGGER.error("Error verifying JWT", { error });
    c.set("user", null);
    c.set("userError", "Error verifying JWT");
    await next();
    return;
  }

  // Shouldn't happen
  if (typeof verifiedJwt !== "object" || !verifiedJwt) {
    LOGGER.error("No verified JWT found", { verifiedJwt });
    c.set("user", null);
    c.set("userError", "No verified JWT found");
    await next();
    return;
  }

  const { userId } = verifiedJwt as { userId: number };

  LOGGER.info("Found userId", { userId });

  const user = await fetchUserById(userId);

  LOGGER.info("Returned user", { user: user ? "found" : "not found" });

  if (!user) {
    c.set("user", null);
    c.set("userError", "No user found in database");
  } else {
    c.set("user", user);
    c.set("userError", null);
  }

  await next();
};

// Helper middleware to require authentication
export const requireAuth: MiddlewareHandler = async (c, next) => {
  // authMiddleware should be run before this middleware
  const user = c.get("user");
  const userError = c.get("userError");

  if (!user) {
    LOGGER.error("No authenticated user found", { userError });
    return c.json({ message: "Unauthorized" }, 401);
  }

  await next();
};
