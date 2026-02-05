import type { Handler } from "aws-lambda";

export const handler: Handler = async () => {
  throw new Error("This should show up in Sentry!");
};
