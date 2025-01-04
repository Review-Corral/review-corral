import { createClient } from "@openauthjs/openauth/client";
import { cookies } from "next/headers";

export const client = createClient({
  clientID: "nextjs",
  issuer: "https://alex-auth.reviewcorral.com", // TODO: get dynamically
});

export function setTokens(access: string, refresh: string) {
  const cookieStore = cookies();

  console.log("Setting tokens", { access, refresh });

  cookieStore.set("refresh_token", refresh, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day expiration
  });
  cookieStore.set("access_token", access, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day expiration
  });
}
