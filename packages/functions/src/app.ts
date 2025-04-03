import { Logger } from "@domain/logging";
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";

// Import all route modules
import { app as authRoutes } from "./auth/routes";
import { app as githubRoutes } from "./github/routes";
import { app as organizationRoutes } from "./organization/routes";
import { app as profileRoutes } from "./profile/routes";
import { app as slackRoutes } from "./slack/routes";
import { app as stripeRoutes } from "./stripe/routes";

const LOGGER = new Logger("app:main");

// Create the main app
const app = new Hono();

// Home route - simple health check
app.get("/", (c) => {
  return c.text(`Hello World. The time is ${new Date().toISOString()}`);
});

// Auth routes - mount at /auth
LOGGER.info("Mounting auth routes at /auth");
app.route("/auth", authRoutes);

// Profile routes - mount at /profile
LOGGER.info("Mounting profile routes at /profile");
app.route("/profile", profileRoutes);

// GitHub routes - mount at /gh
LOGGER.info("Mounting GitHub routes at /gh");
app.route("/gh", githubRoutes);

// Stripe routes - mount at /stripe
LOGGER.info("Mounting Stripe routes at /stripe");
app.route("/stripe", stripeRoutes);

// Organization routes - mount at /org
LOGGER.info("Mounting Organization routes at /org");
app.route("/org", organizationRoutes);

// Slack routes - mount at /slack
LOGGER.info("Mounting Slack routes at /slack");
app.route("/slack", slackRoutes);

// Export the Lambda handler
export const handler = handle(app);
