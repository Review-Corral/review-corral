import { getDns } from "./dns";
import { table } from "./storage";

const ghClientId = new sst.Secret("GithubClientId");
const ghClientSecret = new sst.Secret("GithubClientSecret");

// export const auth = new sst.aws.Auth("Auth", {
//   authorizer: {

//     handler: "./packages/functions/src/auth/authServer.handler",
//     url: {
//       cors: { allowOrigins: ["http://localhost:3000"] },
//     },
//   },
//   forceUpgrade: "v2",
// });

export const auth = new sst.aws.Function("MyAuth", {
  handler: "./packages/functions/src/auth/authServer.handler",
  url: {
    cors: false,
  },
  link: [table, ghClientId, ghClientSecret],
});

export const authRouter = new sst.aws.Router("AuthRouter", {
  routes: {
    "/*": auth.url,
  },
  domain: getDns("auth"),
});
