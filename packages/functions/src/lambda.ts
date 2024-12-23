import ApiHandler from "./handler";

export const handler = ApiHandler(async (_event) => {
  return {
    statusCode: 200,
    body: `Hello world. The time is ${new Date().toISOString()}`,
  };
});
