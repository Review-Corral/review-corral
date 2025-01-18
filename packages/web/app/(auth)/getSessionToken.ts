"use client";

import Cookies from "js-cookie";
import { AuthAccessTokenKey } from "./const";

export const getSessionToken = (): string => {
  const token = Cookies.get(AuthAccessTokenKey);

  if (!token) {
    console.log("No access token found");
    throw new Error("User not logged in");
  }

  console.log("Found access token");
  return token;
};
