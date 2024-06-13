"use client";

import Providers from "./providers";

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <div className="min-h-full min-w-[900px] overflow-x-auto">
      <main className="">
        <Providers>{children}</Providers>
        <div className="max-w-7xl mx-auto py-6 px-7">{children}</div>
      </main>
    </div>
  );
}
