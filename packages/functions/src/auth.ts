import { assertVarExists } from "@core/utils/assert";
import { Db } from "@domain/dynamodb/client";
import { fetchUserById, insertUser } from "@domain/dynamodb/fetchers/users";
import { UserResponse } from "@domain/github/endpointTypes";
import { Logger } from "@domain/logging";
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { HTTPException } from "hono/http-exception";
import { sign } from "jsonwebtoken";
import ky from "ky";

const LOGGER = new Logger("functions:auth");

const app = new Hono();

const JWT_SECRET = assertVarExists("JWT_SECRET");

/**
 * Take the code and exchange it for tokens from GH
 */
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

app.get("/", (c) => c.text("Hello Hono!"));
app.get("/callback", async (c) => {
  const code = c.req.query("code");

  if (!code) {
    throw new HTTPException(400, { message: "No code provided" });
  }

  try {
    // Exchange code for GitHub access token
    const tokenData = await exchangeCodeForToken(code);
    const githubUser = await getOrCreateUser(tokenData.access_token);

    // Generate JWT access token
    const accessToken = sign(
      {
        userId: `github_${githubUser.userId}`,
        email: githubUser.email,
      },
      JWT_SECRET,
      { expiresIn: "12h" },
    );

    // Set cookies and return response
    return c.json({ success: true }, 200, {
      "Set-Cookie": [
        `accessToken=${accessToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`,
      ],
    });
  } catch (error) {
    console.error("Auth error:", error);
    throw new HTTPException(500, { message: "Authentication failed" });
  }
});

export const handler = handle(app);
