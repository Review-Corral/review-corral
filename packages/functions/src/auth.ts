import { AuthHandler, GithubAdapter } from "sst/node/auth";
import { assertVarExists } from "../../core/utils/assert";

export const handler = AuthHandler({
  providers: {
    github: GithubAdapter({
      clientID: assertVarExists("GH_CLIENT_ID"),
      clientSecret: assertVarExists("GH_CLIENT_SECRET"),
      scope: "repo",
      onSuccess: async (tokenset) => {
        console.log("IN ON AUTH SUCCESS");
        const claims = tokenset.claims();

        console.log({ claims });
        return {
          statusCode: 200,
          body: JSON.stringify(tokenset.claims()),
        };
      },
    }),
  },
});
