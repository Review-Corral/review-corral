import { createFileRoute } from "@tanstack/react-router";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_landing/animations")({
  component: RouteComponent,
});

// Timing configuration (in seconds)
const CAROUSEL_DURATION = 0.5;
const COMET_DURATION = 0.8;
const PAUSE_AFTER_COMET = 0.3;
const TOTAL_CYCLE = CAROUSEL_DURATION + COMET_DURATION + PAUSE_AFTER_COMET;

// Maps carousel item index to which paths should have comets
const pathMapping: Record<number, number[]> = {
  0: [0, 1], // Item 1 → Paths 1 & 2
  1: [1, 3], // Item 2 → Paths 2 & 4
  2: [2], // Item 3 → Path 3 only
  3: [0, 2], // Item 4 → Paths 1 & 2
};

const items = ["First Item", "Second Item", "Third Item", "Fourth Item"];

function RouteComponent() {
  const [cycle, setCycle] = useState(0);

  // Advance cycle on a fixed interval
  useEffect(() => {
    const interval = setInterval(() => {
      setCycle((prev) => prev + 1);
    }, TOTAL_CYCLE * 1000);
    return () => clearInterval(interval);
  }, []);

  const currentIndex = cycle % items.length;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="flex items-center gap-4">
        <VerticalCarousel currentIndex={currentIndex} cycle={cycle} />
        <LineTrailAnimation activeItem={currentIndex} cycle={cycle} />
      </div>
    </div>
  );
}

interface LineTrailAnimationProps {
  activeItem: number;
  cycle: number;
}

function LineTrailAnimation({ activeItem, cycle }: LineTrailAnimationProps) {
  const strokeWidth = 6;
  const svgWidth = 300;
  const svgHeight = 160 + strokeWidth;

  // Define 4 forking paths
  const branchX = 100;
  const radius = 8;
  const startY = 80 + strokeWidth / 2;
  const endYPositions = [20, 60, 100, 140];

  const paths = endYPositions.map((endY) => {
    const yDiff = endY - startY + strokeWidth / 2;
    const curveDirection = yDiff < 0 ? -1 : yDiff > 0 ? 1 : 0;
    const absYDiff = Math.abs(yDiff);

    if (curveDirection === 0) {
      return `M 0 ${startY} H ${svgWidth}`;
    }

    const curveRadius = Math.min(radius, absYDiff / 2);
    const endYWithOffset = endY + strokeWidth / 2;
    return `M 0 ${startY} H ${branchX - curveRadius} Q ${branchX} ${startY} ${branchX} ${startY + curveDirection * curveRadius} L ${branchX} ${endYWithOffset - curveDirection * curveRadius} Q ${branchX} ${endYWithOffset} ${branchX + curveRadius} ${endYWithOffset} H ${svgWidth}`;
  });

  // Create comet particles
  const particleCount = 20;
  const createParticles = (pathIndex: number) =>
    Array.from({ length: particleCount }, (_, i) => {
      const progress = i / particleCount;
      const color = progress < 0.2 ? "#ffffff" : progress < 0.5 ? "#ec4899" : "#a855f7";
      const opacity = 1 - progress * 0.9;
      const delay = CAROUSEL_DURATION + i * 0.02; // Start after carousel
      return { id: `path-${pathIndex}-particle-${i}`, color, opacity, delay };
    });

  const activePaths = pathMapping[activeItem] ?? [];

  return (
    <div className="relative" style={{ width: svgWidth, height: svgHeight }}>
      <svg width={svgWidth} height={svgHeight} className="absolute inset-0" fill="none">
        {/* Background pipes */}
        {paths.map((path, i) => (
          <path
            key={`pipe-${endYPositions[i]}`}
            d={path}
            stroke="#374151"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        ))}

        {/* Comet particles - keyed by cycle to restart animation */}
        {activePaths.map((pathIndex) =>
          createParticles(pathIndex).map((particle) => (
            <foreignObject
              key={`${cycle}-${particle.id}`}
              x="0"
              y="0"
              width={svgWidth}
              height={svgHeight}
            >
              <motion.div
                style={{
                  width: strokeWidth,
                  height: strokeWidth,
                  borderRadius: "50%",
                  backgroundColor: particle.color,
                  opacity: particle.opacity,
                  offsetPath: `path('${paths[pathIndex]}')`,
                  offsetRotate: "0deg",
                }}
                initial={{ offsetDistance: "0%" }}
                animate={{ offsetDistance: "100%" }}
                transition={{
                  duration: COMET_DURATION,
                  ease: "easeInOut",
                  delay: particle.delay,
                }}
              />
            </foreignObject>
          )),
        )}
      </svg>
    </div>
  );
}

interface VerticalCarouselProps {
  currentIndex: number;
  cycle: number;
}

function VerticalCarousel({ currentIndex }: VerticalCarouselProps) {
  const itemHeight = 48;

  return (
    <div className="relative w-64 overflow-hidden" style={{ height: itemHeight * 3 }}>
      {/* Top fade gradient */}
      <div
        className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
        style={{
          height: itemHeight,
          background: "linear-gradient(to bottom, #030712 0%, transparent 100%)",
        }}
      />
      {/* Bottom fade gradient */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
        style={{
          height: itemHeight,
          background: "linear-gradient(to top, #030712 0%, transparent 100%)",
        }}
      />
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentIndex}
          initial={{ y: -itemHeight * 1.5 }}
          animate={{ y: itemHeight }}
          exit={{ y: itemHeight * 3.5 }}
          transition={{ duration: CAROUSEL_DURATION, ease: "easeInOut" }}
          className="absolute left-0 right-0 flex items-center justify-center text-sm font-semibold border-2"
          style={{
            height: itemHeight,
            borderColor: "#AD46FF",
            backgroundColor: "#FFE1F2",
            borderRadius: 8,
          }}
        >
          {items[currentIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
