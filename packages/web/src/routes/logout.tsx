import { createFileRoute, redirect } from "@tanstack/react-router";
import Cookies from "js-cookie";
import { AuthAccessTokenKey } from "@/lib/auth/const";
import { Loading } from "@components/ui/cards/loading";

export const Route = createFileRoute("/logout")({
  beforeLoad: () => {
    // Remove the auth cookie
    Cookies.remove(AuthAccessTokenKey);

    // Redirect to home
    throw redirect({ to: "/" });
  },
  component: () => <Loading />,
});
