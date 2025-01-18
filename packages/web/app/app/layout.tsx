"use client";

import Providers from "./providers";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Providers>{children}</Providers>;
}
