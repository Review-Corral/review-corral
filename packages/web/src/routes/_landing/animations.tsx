import { createFileRoute } from "@tanstack/react-router";
import * as motion from "motion/react-client";

export const Route = createFileRoute("/_landing/animations")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <LineTrailAnimation />
    </div>
  );
}

function LineTrailAnimation() {
  const lineWidth = 400;
  const lineHeight = 6;
  const cometWidth = 100;

  return (
    <div
      className="relative bg-gray-700 rounded-full overflow-hidden"
      style={{ width: lineWidth, height: lineHeight }}
    >
      {/* Comet - single box with gradient tail */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: cometWidth,
          height: lineHeight,
          background:
            "linear-gradient(to right, transparent 0%, #a855f7 40%, #ec4899 80%, #ffffff 100%)",
        }}
        initial={{ x: -cometWidth }}
        animate={{ x: lineWidth }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: 0.5,
        }}
      />
    </div>
  );
}
