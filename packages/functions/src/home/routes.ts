import { Hono } from "hono";
import { handle } from "hono/aws-lambda";

const app = new Hono();

// Root route - basic health check
app.get("/", (c) => {
  return c.text(`Hello World. The time is ${new Date().toISOString()}`);
});

export const handler = handle(app);