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
    <>
      <NavbarWithOrgContext />
      <div className="bg-white min-h-screen">{children}</div>
      <Toaster />
    </>
  );
}
