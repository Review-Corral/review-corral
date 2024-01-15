"use server";

import { User } from "@core/db/types";
import { Logger } from "@core/logging";
import ky from "ky";
import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const LOGGER = new Logger("dashboard:actions");

/**
 * Returns the user if they are logged in, else undefined
 */
export async function useOptionalUser(): Promise<User | undefined> {
  const authToken = getAuthToken();

  if (!authToken) {
    return undefined;
  }

  return fetchUser(authToken.value);
}

/**
 * Returns the user if they are logged in, otherwise redirects to login
 */
export async function useUser(): Promise<User> {
  const authToken = getAuthToken();

  // Middleware should effectively ensure that this token is set,
  // but checking anyways
  if (!authToken?.value) {
    LOGGER.info("No auth token found, redirecting to login");
    redirect("/login");
  }

  return fetchUser(authToken.value);
}

const getAuthToken = (): RequestCookie | undefined => {
  const cookieStore = cookies();
  return cookieStore.get("authToken");
};

const fetchUser = async (token: string): Promise<User> =>
  await ky
    .get(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .json<User>();
