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

// GitHub mark path (original 98x96, will be scaled)
// This is a closed path that traces the Octocat outline
const GITHUB_MARK_PATH = "M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z";

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
  const svgWidth = 400;
  const svgHeight = 160 + strokeWidth;

  // Layout constants
  const githubScale = 0.5;
  const githubWidth = 98 * githubScale;
  const githubHeight = 96 * githubScale;
  const githubX = 20;
  const branchX = 150;
  const startY = 80 + strokeWidth / 2;
  const endYPositions = [20, 60, 100, 140];
  const radius = 8;

  // Full paths from start to each endpoint (continuous, like before)
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
      const delay = CAROUSEL_DURATION + i * 0.02;
      return { id: `path-${pathIndex}-particle-${i}`, color, opacity, delay };
    });

  const activePaths = pathMapping[activeItem] ?? [];

  // Calculate when comet passes through GitHub logo area (for gradient timing)
  const githubStartPercent = githubX / svgWidth;
  const githubEndPercent = (githubX + githubWidth) / svgWidth;
  const githubPassDelay = CAROUSEL_DURATION + COMET_DURATION * githubStartPercent;

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

        {/* GitHub mark with animated gradient */}
        <defs>
          <linearGradient id="github-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <motion.stop
              key={`stop0-${cycle}`}
              offset="0%"
              initial={{ stopColor: "#374151" }}
              animate={{ stopColor: ["#374151", "#a855f7", "#ec4899", "#ffffff", "#374151"] }}
              transition={{
                duration: 0.5,
                delay: githubPassDelay,
                ease: "easeInOut",
              }}
            />
            <motion.stop
              key={`stop50-${cycle}`}
              offset="50%"
              initial={{ stopColor: "#374151" }}
              animate={{ stopColor: ["#374151", "#374151", "#a855f7", "#ec4899", "#374151"] }}
              transition={{
                duration: 0.5,
                delay: githubPassDelay,
                ease: "easeInOut",
              }}
            />
            <motion.stop
              key={`stop100-${cycle}`}
              offset="100%"
              initial={{ stopColor: "#374151" }}
              animate={{ stopColor: ["#374151", "#374151", "#374151", "#a855f7", "#374151"] }}
              transition={{
                duration: 0.5,
                delay: githubPassDelay,
                ease: "easeInOut",
              }}
            />
          </linearGradient>
        </defs>
        <g transform={`translate(${githubX}, ${startY - githubHeight / 2}) scale(${githubScale})`}>
          <path
            d={GITHUB_MARK_PATH}
            stroke="url(#github-gradient)"
            strokeWidth={strokeWidth / githubScale}
            fill="none"
          />
        </g>

        {/* Comet particles */}
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
