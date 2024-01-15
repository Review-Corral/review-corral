import { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  console.log("Hello from middleware");
  if (!request.nextUrl.pathname.startsWith("/login")) {
    // This logic is only applied to /about
  }

  const cookies = request.cookies;
  const authtoken = cookies.get("authToken");
  // console.log({ authtoken });
}
