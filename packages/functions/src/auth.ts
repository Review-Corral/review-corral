import { AuthHandler, GithubAdapter } from "sst/node/auth";
import { assertVarExists } from "../../core/utils/assert";

export const handler = AuthHandler({
  providers: {
    github: GithubAdapter({
      clientID: assertVarExists("GH_CLIENT_ID"),
      clientSecret: assertVarExists("GH_CLIENT_SECRET"),
      scope: "user",
      onSuccess: async (tokenset) => {
        console.log("IN ON AUTH SUCCESS");
        console.log({ tokenset });
        return {
          statusCode: 200,
          body: JSON.stringify(tokenset),
        };
      },
    }),
  },
});
