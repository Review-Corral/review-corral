import { Header } from "@components/ui/header";
import React, { FC } from "react";

interface SharedLayoutProps {
  title: string;
}

export const SharedLayout: FC<React.PropsWithChildren<SharedLayoutProps>> = ({
  title,
  children,
}) => {
  return (
    <div className="space-y-12">
      <Header>{title}</Header>
      <div className="flex justify-between items-start">{children}</div>
    </div>
  );
};
