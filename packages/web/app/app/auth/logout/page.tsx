"use client";

import { Loading } from "@/components/ui/cards/loading";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FC, useEffect } from "react";

export const auth_access_token_key = "sst_auth_access_token";

const Page: FC = () => {
  useEffect(() => {
    cookies().delete(auth_access_token_key);
    redirect("/");
  }, []);

  // This part will never be reached due to the redirects
  return <Loading />;
};

export default Page;
