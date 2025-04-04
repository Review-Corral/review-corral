"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { CSPostHogProvider } from "./providers";
const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <CSPostHogProvider>
        <body className={`${inter.className} bg-gray-50`}>{children}</body>
      </CSPostHogProvider>
    </html>
  );
}
