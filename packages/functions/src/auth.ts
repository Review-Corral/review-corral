import ky from "ky";
import {
  AuthHandler,
  GithubAdapter,
  OauthBasicConfig,
  Session,
} from "sst/node/auth";
import { fetchUserById, insertUser } from "../../core/db/fetchers/users";
import { UserResponse } from "../../core/github/endpointTypes";
import { Logger } from "../../core/logging";
import { assertVarExists } from "../../core/utils/assert";
import config from "../../core/utils/config";
import { HttpError } from "../../core/utils/errors/Errors";

declare module "sst/node/auth" {
  export interface SessionTypes {
    user: {
      userId: number;
    };
  }
}

const LOGGER = new Logger("functions:auth");

const onSuccess: OauthBasicConfig["onSuccess"] = async (tokenSet) => {
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

  return Session.parameter({
    redirect: config.isLocal
      ? `${assertVarExists("BASE_FE_URL")}/login/success`
      : `https://${assertVarExists("BASE_FE_URL")}/login/success`,
    type: "user",
    properties: {
      userId: user.id,
    },
  });
};

const getOrCreateUser = async (user: UserResponse, accessToken: string) => {
  const existingUser = await fetchUserById(user.id);

  if (existingUser) {
    LOGGER.info("Found existing user", { id: user.id });
    return existingUser;
  }

  LOGGER.info("User does not exist, creating a new user", { id: user.id });
  // create a user
  return await insertUser(user, accessToken);
};

const githubAdapter = GithubAdapter({
  clientID: assertVarExists("GH_CLIENT_ID"),
  clientSecret: assertVarExists("GH_CLIENT_SECRET"),
  scope: "user",
  onSuccess,
});

export const handler = AuthHandler({
  providers: {
    github: githubAdapter,
  },
});
