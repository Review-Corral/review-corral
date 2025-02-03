"use client";

import { useProtectedRoute } from "@auth/useProtectedRoute";
import { Navbar } from "./Navbar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useProtectedRoute();

  return (
    <>
      <Navbar />
      <div className="bg-white min-h-screen">{children}</div>
    </>
  );
}
