import { NextResponse } from "next/server";

export function GET(request: Request) {
  const { searchParams: params } = new URL(request.url);

  let queryString = "";

  for (const param of params.entries()) {
    queryString += `${param[0]}=${param[1]}&`;
  }
  return NextResponse.redirect(
    "http://localhost:54321/auth/v1/callback?" + queryString,
  );
}
