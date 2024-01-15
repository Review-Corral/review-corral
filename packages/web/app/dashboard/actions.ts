"use server";

import { User } from "@core/db/types";
import { Logger } from "@core/logging";
import ky from "ky";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const LOGGER = new Logger("dashboard:actions");

export async function useUser() {
  const cookieStore = cookies();
  const authToken = cookieStore.get("authToken");

  // Middleware should effectively ensure that this token is set,
  // but checking anyways
  if (!authToken?.value) {
    LOGGER.info("No auth token found, redirecting to login");
    redirect("/login");
  }

  const user = await ky
    .get(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${authToken?.value}`,
      },
    })
    .json<User>();

  return user;
}
