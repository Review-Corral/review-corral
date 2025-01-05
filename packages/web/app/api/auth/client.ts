import { createClient } from "@openauthjs/openauth/client";
import { NextResponse } from "next/server";

export const client = createClient({
  clientID: "nextjs",
  issuer: "https://w3yd2z6vpai6xz2cb7vvrinbve0ujbgs.lambda-url.us-east-1.on.aws/", // TODO: get dynamically
});

export function setTokens(response: NextResponse, access: string, refresh: string) {
  console.log("Setting tokens", { access, refresh });

  response.cookies.set("refresh_token", refresh, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day expiration
  });
  response.cookies.set("access_token", access, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day expiration
  });
}
