import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppProps } from "next/app";
import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { Database } from "../database-types";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  const isProduction = process.env.NODE_ENV === "production";
  const [supabaseClient] = useState(() =>
    createBrowserSupabaseClient<Database>(),
  );
  const [queryClient] = useState(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          refetchOnReconnect: true,
          retry: 0,
        },
      },
    });
  });

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={pageProps.initialSession}
    >
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
        <Toaster position="top-right" />
      </QueryClientProvider>
    </SessionContextProvider>
  );
}

export default MyApp;

export { reportWebVitals } from "next-axiom";
