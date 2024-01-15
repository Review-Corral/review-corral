"use server";

import { cookies } from "next/headers";

export async function setAuthTokenCookie(authToken: string) {
  cookies().set({
    name: "authToken",
    value: authToken,
    httpOnly: true,
    path: "/",
  });

  return;
}
