"use client";

import { Loading } from "@/components/ui/cards/loading";
import Cookies from "js-cookie";
import { redirect } from "next/navigation";
import { FC, useEffect } from "react";

export const auth_access_token_key = "sst_auth_access_token";

const Page: FC = () => {
  useEffect(() => {
    Cookies.remove(auth_access_token_key);
    redirect("/");
  }, []);

  // This part will never be reached due to the redirects
  return <Loading />;
};

export default Page;
