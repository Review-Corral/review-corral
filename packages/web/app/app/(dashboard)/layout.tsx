"use client";

import Providers from "./../providers";

import { useProtectedRoute } from "../auth/useProtectedRoute";
import { Navbar } from "./Navbar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useProtectedRoute();

  return (
    <Providers>
      <Navbar />
      {children}
    </Providers>
  );
}
