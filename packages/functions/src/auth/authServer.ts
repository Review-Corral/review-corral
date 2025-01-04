import { UserResponse } from "@domain/github/endpointTypes.js";
import ky from "ky";
import { Logger } from "@domain/logging";
import { HttpError } from "@core/utils/errors/Errors";
import { fetchUserById, insertUser } from "@domain/dynamodb/fetchers/users";
import { Db } from "@domain/dynamodb/client";
import { Resource } from "sst";
import { authorizer } from "@openauthjs/openauth";
import { GithubProvider } from "@openauthjs/openauth/provider/github";
import { DynamoStorage } from "@openauthjs/openauth/storage/dynamo";
import { handle } from "hono/aws-lambda";
import { subjects } from "./subjects";

const LOGGER = new Logger("functions:auth");

export const preHandler = authorizer({
  subjects,
  storage: DynamoStorage({
    table: Resource.main.name,
  }),
  providers: {
    github: GithubProvider({
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

      if (!user.userId)
        throw new HttpError(500, "User does not have userId (possible null user)");

      return ctx.subject("user", {
        userId: user.userId,
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

preHandler.use("*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "http://localhost:3000"); // Replace with your frontend origin
  c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  c.header("Access-Control-Allow-Credentials", "true"); // If using cookies for authentication

  await next();
});

export const handler = handle(preHandler);
