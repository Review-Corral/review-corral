import { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { userIsLoggedIn } from "./utils";

export const ProtectedRoute: React.FC<
  PropsWithChildren & { redirectPath?: string }
> = ({ redirectPath = "/landing", children }) => {
  if (!userIsLoggedIn()) {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};
