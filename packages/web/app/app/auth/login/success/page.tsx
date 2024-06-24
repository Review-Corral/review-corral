"use client";

import { Loading } from "@/components/ui/cards/loading";
import Cookies from "js-cookie";
import { redirect } from "next/navigation";
import { FC, useEffect } from "react";
import { auth_access_token_key } from "../../const";

const Page: FC<{ searchParams: { token?: string } }> = ({ searchParams }) => {
  console.log("On the auth success page");
  useEffect(() => {
    const token = searchParams.token;

    if (token) {
      Cookies.set(auth_access_token_key, token);
      redirect("/app");
    } else {
      redirect("/error");
    }
  }, []);

  // This part will never be reached due to the redirects
  return <Loading />;
};

export default Page;
