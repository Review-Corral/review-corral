export const auth = new sst.aws.Auth("Auth", {
  authorizer: "./packages/functions/src/auth/handler.handler",
});
