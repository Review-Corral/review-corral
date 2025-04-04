import { User } from "@core/dynamodb/entities/types";
import { fetchUserById } from "@domain/dynamodb/fetchers/users";
import { Logger } from "@domain/logging";
import { APIGatewayEvent } from "aws-lambda";
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

export type Bindings = {
  event: APIGatewayEvent;
};

// Create auth middleware for Hono
export const authMiddleware: MiddlewareHandler<{ Bindings: Bindings }> = async (
  c,
  next,
) => {
  // Skip auth check for OPTIONS requests (CORS preflight)
  if (c.req.method === "OPTIONS") {
    c.set("user", null);
    c.set("userError", null);
    await next();
    return;
  }

  const authHeader = c.req.header("Authorization");
  console.log("Auth header from Hono:", authHeader);

  const event = c.env.event;

  // Log all available headers for debugging
  console.log("All Hono headers:", Object.fromEntries(c.req.raw.headers.entries()));

  if (!event) {
    LOGGER.error("No API Gateway event found");
    c.set("user", null);
    c.set("userError", "No API Gateway event found");
    await next();
    return;
  }

  LOGGER.info("event", { event });

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
  // Skip auth check for OPTIONS requests (CORS preflight)
  if (c.req.method === "OPTIONS") {
    await next();
    return;
  }
  
  // authMiddleware should be run before this middleware
  const user = c.get("user");
  const userError = c.get("userError");

  if (!user) {
    LOGGER.error("No authenticated user found", { userError });
    return c.json({ message: "Unauthorized" }, 401);
  }

  await next();
};
