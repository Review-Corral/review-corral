import { ApiHandler } from "@src/apiHandler";

export const handler = ApiHandler(async (_evt) => {
  return {
    statusCode: 200,
    body: `Hello World. The time is ${new Date().toISOString()}`,
  };
});
