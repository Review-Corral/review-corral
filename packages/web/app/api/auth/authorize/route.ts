import { NextResponse } from "next/server";
import { client } from "../client";

/**
 * Handles GET requests to the /api/authorize endpoint.
 * Redirects the user to the authorization URL.
 */
export async function GET(request: Request) {
  try {
    // Get the origin of the request
    const origin = new URL(request.url).origin;
    console.log(`Got origin in /authorize: ${origin}`);

    // Call your authorization client to get the redirect URL
    const { url } = await client.authorize(`${origin}/callback`, "code");

    // Redirect the user to the authorization URL
    return NextResponse.redirect(url, 302);
  } catch (error) {
    console.error("Error in /authorize:", error);
    return NextResponse.json({ error: "Failed to authorize" }, { status: 500 });
  }
}
