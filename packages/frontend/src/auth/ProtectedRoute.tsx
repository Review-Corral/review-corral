import { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { getSessionToken } from "./getSessionToken";

export const ProtectedRoute: React.FC<
  PropsWithChildren & { redirectPath?: string }
> = ({ redirectPath = "/landing", children }) => {
  if (!userIsLoggedIn()) {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

const userIsLoggedIn = () => {
  try {
    getSessionToken();
    return true;
  } catch (error) {
    return false;
  }
};
