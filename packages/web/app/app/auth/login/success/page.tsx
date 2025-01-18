"use client";

import { Loading } from "@/components/ui/cards/loading";
import Cookies from "js-cookie";
import { useRouter, useSearchParams } from "next/navigation";
import { FC, Suspense, useEffect } from "react";
import { auth_access_token_key } from "../../const";

const Page: FC = () => {
  console.log("On the auth success page");

  // This part will never be reached due to the redirects
  return (
    <Suspense>
      <ParseToken />
      <Loading />
    </Suspense>
  );
};

const ParseToken: FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      Cookies.set(auth_access_token_key, token);
      router.replace("/app");
    } else {
      console.error(`No token found in the URL, ${searchParams.toString()}`);
      router.replace("/app/auth/login/error");
    }
  }, [searchParams]);

  return null;
};

export default Page;
