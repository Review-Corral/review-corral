import { createFileRoute } from "@tanstack/react-router";
import { PipeAnimationDemo } from "@/components/landing/PipeAnimation";

export const Route = createFileRoute("/_landing/animations")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <PipeAnimationDemo />
    </div>
  );
}
