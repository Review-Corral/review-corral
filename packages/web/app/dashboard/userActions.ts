"use server";

import { BASE_URL } from "@/lib/fetchers/shared";
import { User } from "@core/db/types";
import { Logger } from "@core/logging";
import ky from "ky";
import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const LOGGER = new Logger("userActions");

export type AuthedUser = User & {
  authToken: string;
};

/**
 * Returns the user if they are logged in, else undefined
 */
export async function fetchUserOptional(): Promise<AuthedUser | undefined> {
  const authToken = getAuthToken();

  if (!authToken) {
    return undefined;
  }

  return { ...(await _fetchUser(authToken.value)), authToken: authToken.value };
}

/**
 * Returns the user if they are logged in, otherwise redirects to login
 */
export async function fetchUser(): Promise<AuthedUser> {
  const authToken = getAuthToken();

  // Middleware should effectively ensure that this token is set,
  // but checking anyways
  if (!authToken?.value) {
    LOGGER.info("No auth token found, redirecting to login");
    redirect("/login");
  }

  return { ...(await _fetchUser(authToken.value)), authToken: authToken.value };
}

export const getAuthToken = (): RequestCookie | undefined => {
  const cookieStore = cookies();
  return cookieStore.get("authToken");
};

const _fetchUser = async (token: string): Promise<User> =>
  await ky
    .get(`${BASE_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .json<User>();
