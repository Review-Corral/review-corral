"use client";

import { Loading } from "@/components/ui/cards/loading";
import Cookies from "js-cookie";
import { redirect } from "next/navigation";
import { FC, useEffect } from "react";
import { AuthAccessTokenKey } from "../const";

const Page: FC = () => {
  useEffect(() => {
    Cookies.remove(AuthAccessTokenKey);
    redirect("/");
  }, []);

  // This part will never be reached due to the redirects
  return <Loading />;
};

export default Page;
