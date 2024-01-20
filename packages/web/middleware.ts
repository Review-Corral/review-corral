import { NextRequest, NextResponse } from "next/server";

// const LOGGER = new Logger("middleware");

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    const cookies = request.cookies;
    const authtoken = cookies.get("authToken");
    if (!authtoken) {
      // LOGGER.info("No auth token found, redirecting to login");
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
}
