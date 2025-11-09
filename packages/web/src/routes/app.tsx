import Providers from "@/components/providers/Providers";
import { Outlet, createFileRoute } from "@tanstack/react-router";

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
