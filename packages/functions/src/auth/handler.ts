import { GithubAdapter } from "sst/auth/adapter";

import { auth } from "sst/auth";
import { UserResponse } from "@domain/github/endpointTypes.js";
import ky from "ky";
import { session } from "./session";
import { Logger } from "@domain/logging";
import { HttpError } from "@core/utils/errors/Errors";
import { fetchUserById, insertUser } from "@domain/dynamodb/fetchers/users";
import { Db } from "@domain/dynamodb/client";
import { Resource } from "sst";

const LOGGER = new Logger("functions:auth");

export const handler = auth.authorizer({
  session,
  providers: {
    github: GithubAdapter({
      clientID: Resource.GithubClientId.value,
      clientSecret: Resource.GithubClientSecret.value,
      scope: "user",
    }),
  },
  callbacks: {
    auth: {
      async allowClient(_clientID: string, _redirect: string) {
        return true;
      },
      async success(ctx, input) {
        if (input.provider === "github") {
          const tokenSet = input.tokenset;
          LOGGER.info("Successfully authenticated with GitHub");
          console.log({ tokenSet });

          LOGGER.info("Going to fetch user profile information");

          if (!tokenSet.access_token) throw new HttpError(500, "No access token found");

          // Once we get the user access token, we need to fetch information about the user
          // from the API to know who the user is
          const userQuery = await ky
            .get("https://api.github.com/user", {
              headers: {
                Authorization: `token ${tokenSet.access_token}`,
              },
            })
            .json<UserResponse>();

          LOGGER.debug("Users fetch response: ", userQuery);

          const user = await getOrCreateUser(userQuery, tokenSet.access_token);

          const FE_URL = "https://www.alexmclean.ca"; // TODO: get dyanmically

          const redirectUri = `${FE_URL}/app/auth/login/success`;

          LOGGER.debug("Set auth redirect URI ", { redirectUri, userId: user.userId });

          return ctx.session({
            type: "user",
            redirectUri,
            properties: {
              userId: userQuery.id,
            },
          });
        } else {
          throw new HttpError(500, "Unknown provider");
        }
      },
    },
  },
});

const getOrCreateUser = async (user: UserResponse, accessToken: string) => {
  const existingUser = await fetchUserById(user.id);

  if (existingUser) {
    LOGGER.info("Found existing user", { id: user.id });

    // Update the GH access token if different
    if (existingUser.ghAccessToken !== accessToken) {
      LOGGER.info("Updating user access token", { id: user.id });

      await Db.entities.user
        .patch({
          userId: user.id,
        })
        .set({
          ghAccessToken: accessToken,
        })
        .go();
    }

    return existingUser;
  }

  LOGGER.info("User does not exist, creating a new user", { id: user.id });
  // create a user
  return await insertUser(user, accessToken);
};
