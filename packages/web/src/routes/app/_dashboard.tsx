import { createFileRoute, Outlet, useRouter } from "@tanstack/react-router";
import { Toaster } from "react-hot-toast";
import { NavbarWithOrgContext } from "@/components/dashboard/NavbarWithOrgContext";
import { userIsLoggedIn } from "@/lib/auth/utils";
import { useEffect } from "react";

export const Route = createFileRoute("/app/_dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const router = useRouter();

  useEffect(() => {
    // Check auth client-side after hydration
    if (!userIsLoggedIn()) {
      console.log("Not logged in, redirecting to login");
      router.navigate({ to: "/login" });
    }
  }, [router]);

  return (
    <div className="flex flex-col h-full">
      <NavbarWithOrgContext />
      <div className="bg-white grow">
        <Outlet />
      </div>
      <Toaster />
    </div>
  );
}
