"use client";

import { useProtectedRoute } from "@auth/useProtectedRoute";
import { Toaster } from "react-hot-toast";
import { NavbarWithOrgContext } from "./NavbarWithOrgContext";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useProtectedRoute();

  return (
    <div className="flex flex-col h-full">
      <NavbarWithOrgContext />
      <div className="bg-white flex-grow">{children}</div>
      <Toaster />
    </div>
  );
}
