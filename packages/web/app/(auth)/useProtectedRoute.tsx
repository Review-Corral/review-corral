"use client";

import { redirect } from "next/navigation";
import { useLayoutEffect } from "react";
import { userIsLoggedIn } from "./utils";

export const useProtectedRoute = (redirectPath = "/app/auth/login") =>
  useLayoutEffect(() => {
    if (!userIsLoggedIn()) {
      redirect(redirectPath);
    }
  }, []);
