import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { Resource } from "sst";
// Import all route modules
import { app as authRoutes } from "./auth/routes";
import { app as githubRoutes } from "./github/routes";
import { app as organizationRoutes } from "./organization/routes";
import { app as profileRoutes } from "./profile/routes";
import { app as slackRoutes } from "./slack/routes";
import { app as stripeRoutes } from "./stripe/routes";

const app = new Hono();

const frontendUrl = Resource.frontend.url || "*";

console.log("Frontend URL in API:", frontendUrl);

app.use(
  cors({
    origin: frontendUrl,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(logger());

// Home route - simple health check
app.get("/", (c) => {
  return c.text(`Hello World. The time is ${new Date().toISOString()}`);
});

app.route("/auth", authRoutes);
app.route("/profile", profileRoutes);
app.route("/gh", githubRoutes);
app.route("/stripe", stripeRoutes);
app.route("/org", organizationRoutes);
app.route("/slack", slackRoutes);

// Export the Lambda handler
export const handler = handle(app);
