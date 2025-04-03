import { Logger } from "@domain/logging";
import { Hono } from "hono";
import { authMiddleware, requireAuth } from "../middleware/auth";

const LOGGER = new Logger("profile:routes");

export const app = new Hono();

app.use(authMiddleware);
app.use(requireAuth);

// Get user profile
app.get("/", async (c) => {
  LOGGER.info("Getting user profile");
  const user = c.get("user");
  return c.json(user);
});
