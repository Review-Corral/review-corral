"use client";

import { Inter } from "next/font/google";
import { CSPostHogProvider } from "./providers";

interface ClientLayoutProps {
  children: React.ReactNode;
  inter: ReturnType<typeof Inter>;
}

export default function ClientLayout({ children, inter }: ClientLayoutProps) {
  return (
    <CSPostHogProvider>
      <body className={`${inter.className} bg-gray-50`}>{children}</body>
    </CSPostHogProvider>
  );
}
