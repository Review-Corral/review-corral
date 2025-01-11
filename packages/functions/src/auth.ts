import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import {} from "jsonwebtoken";

const app = new Hono();

app.get("/", (c) => c.text("Hello Hono!"));

export const handler = handle(app);
