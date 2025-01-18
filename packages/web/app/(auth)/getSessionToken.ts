"use client";

import Cookies from "js-cookie";
import { AuthAccessTokenKey } from "./const";

export const getSessionToken = (): string => {
  const token = Cookies.get(AuthAccessTokenKey);

  if (!token) {
    throw new Error("User not logged in");
  }

  return token;
};
