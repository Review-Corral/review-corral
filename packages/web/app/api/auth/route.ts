import { subjects } from "@core/auth/subjects";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { client, setTokens } from "./client";

export async function GET(request: Request) {
  const cookiesStore = cookies();

  const accessToken = cookiesStore.get("access_token");
  const refreshToken = cookiesStore.get("refresh_token");

  const origin = new URL(request.url).origin;
  const authorizeResponse = NextResponse.redirect(`${origin}/api/auth/authorize`, 302);

  try {
    if (accessToken) {
      const verified = await client.verify(subjects, accessToken.value, {
        refresh: refreshToken?.value,
      });

      if (verified.err) throw new Error("Invalid access token");

      if (verified.tokens) {
        console.log("Already verified, setting tokens");
        setTokens(authorizeResponse, verified.tokens.access, verified.tokens.refresh);
      }
      return NextResponse.redirect("/", 302);
    } else {
      throw new Error("No access token found");
    }
  } catch (e) {
    console.error(e);
    return authorizeResponse;
  }
}
