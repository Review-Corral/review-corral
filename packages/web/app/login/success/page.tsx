"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { setAuthTokenCookie } from "./actions";

export default function LoginSuccess({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const router = useRouter();

  useEffect(() => {
    if (!("token" in searchParams)) {
      throw Error("No token in search params");
    }

    if (typeof searchParams.token !== "string") {
      throw Error("Token is not a string");
    }

    setAuthTokenCookie(searchParams.token).then(() => router.push("/"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="h-full w-full">Logging in...</div>;
}
