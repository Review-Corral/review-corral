import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import Cookies from "js-cookie";
import { AuthAccessTokenKey } from "@/lib/auth/const";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/login/set-token")({
  validateSearch: searchSchema,
  beforeLoad: ({ search }) => {
    // Set cookie client-side
    if (search.token) {
      Cookies.set(AuthAccessTokenKey, search.token, {
        secure: import.meta.env.PROD,
        sameSite: "lax",
        path: "/",
      });
      throw redirect({ to: "/app" });
    }

    // Redirect to error page if no token
    throw redirect({ to: "/login/error" });
  },
  component: () => <div>Setting up your session...</div>,
});
