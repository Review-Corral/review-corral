import { useSearchParams } from "next/navigation";
import { NextResponse } from "next/server";

export function GET(request: Request) {
  const params = useSearchParams();
  return NextResponse.redirect(
    "http://localhost:54321/auth/callback?" + params,
  );
}
