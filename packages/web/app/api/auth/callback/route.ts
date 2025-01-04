import { NextResponse } from "next/server";
import { client } from "../client";

/**
 * Handles GET requests to the /api/callback endpoint.
 * Processes the authorization code and sets session cookies.
 */
export async function GET(request: Request) {
  try {
    // Get the origin of the request
    const origin = new URL(request.url).origin;

    // Extract the "code" query parameter
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    if (!code) {
      throw new Error("Missing authorization code in /callback");
    }

    // Exchange the authorization code for tokens
    const exchanged = await client.exchange(code, `${origin}/callback`);
    if (exchanged.err) {
      return NextResponse.json({ error: exchanged.err.toString() }, { status: 400 });
    }

    // Set session cookies (access and refresh tokens)
    const response = NextResponse.redirect("/", 302);
    response.cookies.set("access_token", exchanged.tokens.access, {
      path: "/",
      httpOnly: true, // Ensure tokens are secure
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      sameSite: "lax",
    });
    response.cookies.set("refresh_token", exchanged.tokens.refresh, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Error in /callback:", error);
    return NextResponse.json({ error: error.toString() }, { status: 500 });
  }
}
