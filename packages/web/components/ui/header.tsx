import { PropsWithChildren } from "react";

export const Header: React.FC<PropsWithChildren> = ({ children }) => (
  <h1 className="text-2xl font-bold pt-8">{children}</h1>
);
