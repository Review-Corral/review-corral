"use client";

import { Navbar } from "./Navbar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export const DashboardPaddedBody: React.FC<React.PropsWithChildren> = ({
  children,
}) => <div className="max-w-7xl mx-auto py-6 px-7">{children}</div>;
