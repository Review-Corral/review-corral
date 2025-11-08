import { createFileRoute, Outlet } from "@tanstack/react-router";
import Providers from "@/components/providers/Providers";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <Providers>
      <Outlet />
    </Providers>
  );
}
