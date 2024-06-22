"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const queryClient = new QueryClient();

export default function Providers({ children }: React.PropsWithChildren) {
  console.log("IN PROVIDERS");

  console.log("using queryClient: ", queryClient);

  // const [queryClient] = React.useState(() => new QueryClient());

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
