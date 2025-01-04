import { table } from "./storage";

const ghClientId = new sst.Secret("GithubClientId");
const ghClientSecret = new sst.Secret("GithubClientSecret");

export const auth = new sst.aws.Auth("Auth", {
  authorizer: {
    link: [table, ghClientId, ghClientSecret],
    handler: "./packages/functions/src/auth/authServer.handler",
    url: {
      cors: {
        allowOrigins: [
          "http://localhost:3000",
          "https://ozch2fbwx5q2g3grm7cnled74e0gxisu.lambda-url.us-east-1.on.aws",
        ],
      },
    },
  },
  forceUpgrade: "v2",
});
