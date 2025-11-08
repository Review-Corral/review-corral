import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Toaster } from "react-hot-toast";
import { NavbarWithOrgContext } from "@/components/dashboard/NavbarWithOrgContext";
import { userIsLoggedIn } from "@/lib/auth/utils";

export const Route = createFileRoute("/app/_dashboard")({
  beforeLoad: () => {
    if (!userIsLoggedIn()) {
      console.log("Redirecting to login");
      throw redirect({ to: "/login" });
    }
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <div className="flex flex-col h-full">
      <NavbarWithOrgContext />
      <div className="bg-white flex-grow">
        <Outlet />
      </div>
      <Toaster />
    </div>
  );
}
