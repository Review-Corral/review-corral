import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

// Timing configuration (in seconds)
export const CAROUSEL_DURATION = 0.5;
export const COMET_DURATION = 0.8;
export const PAUSE_AFTER_COMET = 0.3;
export const TOTAL_CYCLE =
  CAROUSEL_DURATION + COMET_DURATION + PAUSE_AFTER_COMET;

// Maps carousel item index to which paths should have comets
const pathMapping: Record<number, number[]> = {
  0: [0, 1], // Item 1 → Paths 1 & 2
  1: [1, 3], // Item 2 → Paths 2 & 4
  2: [2], // Item 3 → Path 3 only
  3: [0, 2], // Item 4 → Paths 1 & 2
};

const items = [
  "Pull Request Opened",
  "Review Requested",
  "Pull Request Approved",
  "Pull Request Reopened",
];

// Avatar colors and initials for each pipe endpoint
const avatars = [
  { initials: "JD", bgColor: "#6366f1", textColor: "#ffffff" },
  { initials: "AM", bgColor: "#ec4899", textColor: "#ffffff" },
  { initials: "SK", bgColor: "#f59e0b", textColor: "#000000" },
  { initials: "RW", bgColor: "#10b981", textColor: "#ffffff" },
];

/**
 * Self-contained animation demo that manages its own
 * cycle state and renders the carousel + pipe animation.
 */
export function PipeAnimationDemo() {
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCycle((prev) => prev + 1);
    }, TOTAL_CYCLE * 1000);
    return () => clearInterval(interval);
  }, []);

  const currentIndex = cycle % items.length;

  return (
    <div className="flex items-center gap-4">
      <VerticalCarousel
        currentIndex={currentIndex}
        cycle={cycle}
      />
      <LineTrailAnimation
        activeItem={currentIndex}
        cycle={cycle}
      />
    </div>
  );
}

interface LineTrailAnimationProps {
  activeItem: number;
  cycle: number;
}

export function LineTrailAnimation({
  activeItem,
  cycle,
}: LineTrailAnimationProps) {
  const strokeWidth = 6;
  const avatarSize = 32;
  const svgWidth = 400 + avatarSize + 8;
  const svgHeight = 160 + strokeWidth;

  // Layout constants
  const logoSize = 50;
  const logoX = 20;
  const branchX = 150;
  const startY = 80 + strokeWidth / 2;
  const endYPositions = [20, 60, 100, 140];
  const radius = 8;
  const pipeEndX = 400;

  const paths = endYPositions.map((endY) => {
    const yDiff = endY - startY + strokeWidth / 2;
    const curveDirection = yDiff < 0 ? -1 : yDiff > 0 ? 1 : 0;
    const absYDiff = Math.abs(yDiff);

    if (curveDirection === 0) {
      return `M 0 ${startY} H ${pipeEndX}`;
    }

    const curveRadius = Math.min(radius, absYDiff / 2);
    const endYWithOffset = endY + strokeWidth / 2;
    return `M 0 ${startY} H ${branchX - curveRadius} Q ${branchX} ${startY} ${branchX} ${startY + curveDirection * curveRadius} L ${branchX} ${endYWithOffset - curveDirection * curveRadius} Q ${branchX} ${endYWithOffset} ${branchX + curveRadius} ${endYWithOffset} H ${pipeEndX}`;
  });

  const particleCount = 20;
  const createParticles = (pathIndex: number) =>
    Array.from({ length: particleCount }, (_, i) => {
      const progress = i / particleCount;
      const color =
        progress < 0.2
          ? "#ffffff"
          : progress < 0.5
            ? "#ec4899"
            : "#a855f7";
      const opacity = 1 - progress * 0.9;
      const delay = CAROUSEL_DURATION + i * 0.02;
      return {
        id: `path-${pathIndex}-particle-${i}`,
        color,
        opacity,
        delay,
      };
    });

  const activePaths = pathMapping[activeItem] ?? [];

  const logoStartPercent = logoX / pipeEndX;
  const logoPassDelay =
    CAROUSEL_DURATION + COMET_DURATION * logoStartPercent;

  return (
    <div
      className="relative"
      style={{ width: svgWidth, height: svgHeight }}
    >
      <svg
        width={svgWidth}
        height={svgHeight}
        className="absolute inset-0"
        fill="none"
      >
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

        {/* Logo with animated background */}
        <foreignObject
          x={logoX}
          y={startY - logoSize / 2}
          width={logoSize}
          height={logoSize}
        >
          <div
            style={{
              width: logoSize,
              height: logoSize,
              borderRadius: 8,
              overflow: "hidden",
              position: "relative",
              background: "#ffffff",
            }}
          >
            <motion.div
              key={`logo-gradient-${cycle}`}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: logoSize * 2,
                height: logoSize * 2,
                background:
                  "linear-gradient(135deg, transparent 30%, #a855f7 40%, #ec4899 50%, #ffffff 60%, transparent 70%)",
              }}
              initial={{ x: -logoSize * 2, y: -logoSize * 2 }}
              animate={{ x: logoSize, y: logoSize }}
              transition={{
                duration: 0.7,
                delay: logoPassDelay,
                ease: "easeOut",
              }}
            />
            <img
              src="/review_corral_logo-min.png"
              alt="Review Corral"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                padding: 4,
                position: "relative",
                zIndex: 1,
              }}
            />
          </div>
        </foreignObject>

        {/* User avatars at pipe endpoints */}
        {endYPositions.map((endY, i) => {
          const avatar = avatars[i];
          const cy = endY + strokeWidth / 2;
          const isActive = activePaths.includes(i);
          return (
            <foreignObject
              key={`avatar-${i}`}
              x={pipeEndX + 4}
              y={cy - avatarSize / 2}
              width={avatarSize}
              height={avatarSize}
            >
              <motion.div
                animate={
                  isActive
                    ? {
                        scale: [1, 1.15, 1],
                        boxShadow: [
                          "0 0 0px transparent",
                          `0 0 12px ${avatar.bgColor}`,
                          "0 0 0px transparent",
                        ],
                      }
                    : { scale: 1 }
                }
                transition={
                  isActive
                    ? {
                        delay:
                          CAROUSEL_DURATION + COMET_DURATION,
                        duration: 0.4,
                      }
                    : {}
                }
                key={`avatar-anim-${cycle}-${i}`}
                style={{
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: "50%",
                  backgroundColor: avatar.bgColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: avatar.textColor,
                  border: "2px solid #1f2937",
                }}
              >
                {avatar.initials}
              </motion.div>
            </foreignObject>
          );
        })}
      </svg>
    </div>
  );
}

interface VerticalCarouselProps {
  currentIndex: number;
  cycle: number;
}

export function VerticalCarousel({
  currentIndex,
}: VerticalCarouselProps) {
  const itemHeight = 48;

  return (
    <div
      className="relative w-64 overflow-hidden"
      style={{ height: itemHeight * 3 }}
    >
      {/* Top fade gradient */}
      <div
        className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
        style={{
          height: itemHeight,
          background:
            "linear-gradient(to bottom, #030712 0%, transparent 100%)",
        }}
      />
      {/* Bottom fade gradient */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
        style={{
          height: itemHeight,
          background:
            "linear-gradient(to top, #030712 0%, transparent 100%)",
        }}
      />
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentIndex}
          initial={{ y: -itemHeight * 1.5 }}
          animate={{ y: itemHeight }}
          exit={{ y: itemHeight * 3.5 }}
          transition={{
            duration: CAROUSEL_DURATION,
            ease: "easeInOut",
          }}
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
