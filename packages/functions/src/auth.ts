import ky from "ky";
import { AuthHandler, GithubAdapter } from "sst/node/auth";
import { Logger } from "../../core/logging";
import { assertVarExists } from "../../core/utils/assert";

const LOGGER = new Logger("functions:auth");

export const handler = AuthHandler({
  providers: {
    github: GithubAdapter({
      clientID: assertVarExists("GH_CLIENT_ID"),
      clientSecret: assertVarExists("GH_CLIENT_SECRET"),
      scope: "user",
      onSuccess: async (tokenset) => {
        LOGGER.info("Successfully authenticated with GitHub");
        console.log({ tokenset });

        LOGGER.info("Going to fetch user profile information");

        const response = await ky
          .get("https://api.github.com/user", {
            headers: {
              Authorization: `token ${tokenset.access_token}`,
            },
          })
          .json();

        LOGGER.debug("Users fetch response: ", response);

        return {
          statusCode: 200,
          body: JSON.stringify(tokenset),
        };
      },
    }),
  },
});
