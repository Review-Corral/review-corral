import { UserResponse } from "@domain/github/endpointTypes.js";
import ky from "ky";
import { Logger } from "@domain/logging";
import { HttpError } from "@core/utils/errors/Errors";
import { fetchUserById, insertUser } from "@domain/dynamodb/fetchers/users";
import { Db } from "@domain/dynamodb/client";
import { Resource } from "sst";
import { authorizer, createSubjects } from "@openauthjs/openauth";
import { GithubAdapter } from "@openauthjs/openauth/adapter/github";
import { object, string } from "valibot";
import { DynamoStorage } from "@openauthjs/openauth/storage/dynamo";
import { handle } from "hono/aws-lambda";

const LOGGER = new Logger("functions:auth");

export const subjects = createSubjects({
  user: object({
    email: string(),
  }),
});

export const preHandler = authorizer({
  subjects,
  storage: DynamoStorage({
    table: Resource.main.name,
  }),
  providers: {
    github: GithubAdapter({
      clientID: Resource.GithubClientId.value,
      clientSecret: Resource.GithubClientSecret.value,
      scopes: ["user"],
    }),
  },
  success: async (ctx, value, input) => {
    if (value.provider === "github") {
      const tokenSet = value.tokenset;
      LOGGER.info("Successfully authenticated with GitHub");
      console.log({ tokenSet });

      LOGGER.info("Going to fetch user profile information");

      if (!tokenSet.access) throw new HttpError(500, "No access token found");

      // Once we get the user access token, we need to fetch information about the user
      // from the API to know who the user is
      const userQuery = await ky
        .get("https://api.github.com/user", {
          headers: {
            Authorization: `token ${tokenSet.access}`,
          },
        })
        .json<UserResponse>();

      LOGGER.debug("Users fetch response: ", userQuery);

      const user = await getOrCreateUser(userQuery, tokenSet.access);

      if (!user.email) throw new HttpError(500, "Failed to create user");

      const FE_URL = "https://www.alexmclean.ca"; // TODO: get dyanmically
      const redirectUri = `${FE_URL}/app/auth/login/success`;

      LOGGER.debug("Set auth redirect URI ", { redirectUri, userId: user.userId });

      return ctx.subject("user", {
        email: user.email,
      });
    } else {
      throw new HttpError(500, "Unknown provider");
    }
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
  const newUser = await insertUser(user, accessToken);
  if (!newUser.email)
    throw new HttpError(
      500,
      "New created user doesn't have an email property. Failed?",
    );

  return newUser;
};

export const handler = handle(preHandler);
