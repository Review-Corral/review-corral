import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";
import { Database } from "types/database-types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  console.log("In exchange");
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  console.log("Got code: ", code);

  if (code) {
    const supabase = createRouteHandlerClient<Database>(
      {
        cookies,
      },
      {
        cookieOptions: {
          secure: false,
          domain: "localhost",
          path: "/",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 365 * 10,
        },
      },
    );
    const response = await supabase.auth.exchangeCodeForSession(code);

    console.log("Got response: ", response);
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin);
}
