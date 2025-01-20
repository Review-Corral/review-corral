import { assertVarExists } from "@core/utils/assert";
import { Db } from "@domain/dynamodb/client";
import { fetchUserById, insertUser } from "@domain/dynamodb/fetchers/users";
import { UserResponse } from "@domain/github/endpointTypes";
import { LOGGER } from "@domain/github/webhooks/handlers/pullRequest";
import config from "@domain/utils/config";
import { ApiHandler } from "@src/apiHandler";
import { HTTPException } from "hono/http-exception";
import { sign } from "jsonwebtoken";
import ky from "ky";

async function exchangeCodeForToken(code: string) {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: assertVarExists("GH_CLIENT_ID"),
      client_secret: assertVarExists("GH_CLIENT_SECRET"),
      code,
    }),
  });

  return (await response.json()) as { access_token: string };
}

const getOrCreateUser = async (accessToken: string) => {
  const ghUser = await ky
    .get("https://api.github.com/user", {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    })
    .json<UserResponse>();

  LOGGER.debug("Users fetch response: ", ghUser);

  const existingUser = await fetchUserById(ghUser.id);

  if (existingUser?.userId) {
    LOGGER.info("Found existing user", { id: existingUser.userId });

    // Update the GH access token if different
    if (existingUser.ghAccessToken !== accessToken) {
      LOGGER.info("Updating user access token", { id: existingUser.userId });

      await Db.entities.user
        .patch({
          userId: existingUser.userId,
        })
        .set({
          ghAccessToken: accessToken,
        })
        .go();
    }

    return existingUser;
  }

  LOGGER.info("User does not exist, creating a new user", { id: existingUser });
  // create a user
  return await insertUser(ghUser, accessToken);
};

export const handler = ApiHandler(async (event, _context) => {
  const code = event.queryStringParameters?.code;

  if (!code) {
    throw new HTTPException(400, { message: "No code provided" });
  }

  try {
    // Exchange code for GitHub access token
    const tokenData = await exchangeCodeForToken(code);

    if (!tokenData.access_token) {
      console.log("Access tokens: ", tokenData);
      throw new HTTPException(400, { message: "No access token" });
    }
    const githubUser = await getOrCreateUser(tokenData.access_token);

    const JWT_SECRET = assertVarExists("JWT_SECRET");

    // Generate JWT access token
    const accessToken = sign(
      {
        userId: githubUser.userId,
        email: githubUser.email,
      },
      JWT_SECRET,
      { expiresIn: "12h" },
    );

    // Set cookies and return response
    return {
      statusCode: 302,
      body: JSON.stringify({ success: true }),
      headers: {
        "Content-Type": "application/json",
        Location: `${config.frontendBaseUrl}/login/set-token?token=${accessToken}`,
      },
    };
  } catch (error) {
    console.error("Auth error:", error);
    throw new HTTPException(500, { message: "Authentication failed" });
  }
});
