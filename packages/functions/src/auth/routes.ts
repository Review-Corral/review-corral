import { Db } from "@domain/dynamodb/client";
import { fetchUserById, insertUser } from "@domain/dynamodb/fetchers/users";
import { UserResponse } from "@domain/github/endpointTypes";
import { LOGGER } from "@domain/github/webhooks/handlers/pullRequest";
import config from "@domain/utils/config";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { sign } from "jsonwebtoken";
import ky from "ky";
import { Resource } from "sst";

export const app = new Hono();

// GitHub OAuth callback route
app.get("/callback", async (c) => {
  const code = c.req.query("code");

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

    // Generate JWT access token
    const accessToken = sign(
      {
        userId: githubUser.userId,
        email: githubUser.email,
      },
      Resource.JWT_SECRET.value,
      { expiresIn: "12h" },
    );

    // Set location header for redirect
    return c.redirect(
      `${config.frontendBaseUrl}/login/set-token?token=${accessToken}`,
      302,
    );
  } catch (error) {
    console.error("Auth error:", error);
    throw new HTTPException(500, { message: "Authentication failed" });
  }
});

// Helper functions
async function exchangeCodeForToken(code: string) {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: Resource.GH_CLIENT_ID.value,
      client_secret: Resource.GH_CLIENT_SECRET.value,
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
