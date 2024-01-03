import { getSessionToken } from "./getSessionToken";

export const userIsLoggedIn = () => {
  try {
    getSessionToken();
    return true;
  } catch (error) {
    return false;
  }
};
