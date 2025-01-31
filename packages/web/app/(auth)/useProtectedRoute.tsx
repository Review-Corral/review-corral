"use client";

import { redirect } from "next/navigation";
import { useLayoutEffect } from "react";
import { userIsLoggedIn } from "./utils";

export const useProtectedRoute = (redirectPath = "/login") =>
  useLayoutEffect(() => {
    if (!userIsLoggedIn()) {
      console.log("Redirecting to login");
      redirect(redirectPath);
    }
  }, []);
