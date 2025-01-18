import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AuthAccessTokenKey } from "../../const";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (token) {
    // Set the cookie
    // By default, `cookies()` is available in the Route Handler
    (await cookies()).set(AuthAccessTokenKey, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    return NextResponse.redirect(`${process.env.BASE_URL}/app`);
  }

  return NextResponse.redirect(`${process.env.BASE_URL}/app/auth/login/error`);
}
