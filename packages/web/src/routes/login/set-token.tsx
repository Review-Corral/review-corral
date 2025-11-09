import { AuthAccessTokenKey } from "@/lib/auth/const";
import { createFileRoute } from "@tanstack/react-router";
import { setCookie } from "@tanstack/react-start/server";
import { z } from "zod";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/login/set-token")({
  validateSearch: searchSchema,
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token");

        console.log("set-token GET handler:", { token, url: url.toString() });

        if (token) {
          // Set the cookie server-side
          console.log("Setting cookie:", AuthAccessTokenKey, "with token:", token);
          setCookie(AuthAccessTokenKey, token, {
            httpOnly: false,
            secure: import.meta.env.PROD,
            sameSite: "lax",
            path: "/",
          });

          console.log("Redirecting to /app");
          // Redirect to app
          return new Response(null, {
            status: 302,
            headers: {
              Location: "/app",
            },
          });
        }

        console.log("No token, redirecting to error");
        // Redirect to error page if no token
        return new Response(null, {
          status: 302,
          headers: {
            Location: "/login/error",
          },
        });
      },
    },
  },
  component: () => <div>Setting up your session...</div>,
});
