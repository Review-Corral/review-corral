import { subjects } from "@core/auth/subjects";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { client, setTokens } from "./client";

export async function GET(_request: Request) {
  const cookiesStore = cookies();

  const accessToken = cookiesStore.get("access_token");
  const refreshToken = cookiesStore.get("refresh_token");

  try {
    if (accessToken) {
      const verified = await client.verify(subjects, accessToken.value, {
        refresh: refreshToken?.value,
      });

      if (verified.err) throw new Error("Invalid access token");

      if (verified.tokens) {
        setTokens(verified.tokens.access, verified.tokens.refresh);
      }
    }
  } catch (e) {
    console.error(e);
    return NextResponse.redirect("/api/auth/authorize", 302);
  }
}
