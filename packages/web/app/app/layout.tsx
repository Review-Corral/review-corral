"use client";

import Providers from "../providers";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <div className="max-w-7xl mx-auto py-6 px-7">{children}</div>
    </Providers>
  );
}
