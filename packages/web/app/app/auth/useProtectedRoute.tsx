"use client";

import { useLayoutEffect } from "react";
import { userIsLoggedIn } from "./utils";
import { redirect } from "next/navigation";

export const useProtectedRoute = (redirectPath = "/app/auth/login") =>
  useLayoutEffect(() => {
    if (!userIsLoggedIn()) {
      redirect(redirectPath);
    }
  }, []);
