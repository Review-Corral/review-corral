import Cookies from "js-cookie";
import { auth_access_token_key } from "./const";

export const getSessionToken = (): string => {
  const token = Cookies.get(auth_access_token_key);

  if (!token) {
    throw new Error("User not logged in");
  }

  return token;
};
