import { getDns } from "./dns";
import { table } from "./storage";

const ghClientId = new sst.Secret("GithubClientId");
const ghClientSecret = new sst.Secret("GithubClientSecret");

export const auth = new sst.aws.Auth("Auth", {
  authorizer: {
    link: [table, ghClientId, ghClientSecret],
    handler: "./packages/functions/src/auth/authServer.handler",
    url: true,
  },
  forceUpgrade: "v2",
});

// ==============================
// Auth
// ==============================
// we're creating a lambda here because this is a Hono app
// const authApi = new sst.aws.Function("AuthApi", {
//   handler: "packages/functions/src/auth/client.handler",
//   url: {
//     cors: false,
//   }
//   environment: {
//     OPENAUTH_ISSUER: auth.url.apply((v) => v!.replace(/\/$/, "")),
//   },
// });

export const authRouter = new sst.aws.Router("AuthRouter", {
  routes: {
    "/*": auth.url,
  },
  domain: getDns("auth"),
});
