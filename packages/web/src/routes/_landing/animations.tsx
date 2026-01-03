import { createFileRoute } from "@tanstack/react-router";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_landing/animations")({
  component: RouteComponent,
});

function RouteComponent() {
  const [phase, setPhase] = useState<"carousel" | "comet">("carousel");

  const handleCarouselComplete = () => {
    setPhase("comet");
  };

  const handleCometComplete = () => {
    setTimeout(() => {
      setPhase("carousel");
    }, 500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="flex items-center gap-4">
        <VerticalCarousel
          items={["First Item", "Second Item", "Third Item", "Fourth Item"]}
          isActive={phase === "carousel"}
          onComplete={handleCarouselComplete}
        />
        <LineTrailAnimation
          isActive={phase === "comet"}
          onComplete={handleCometComplete}
        />
      </div>
    </div>
  );
}

interface LineTrailAnimationProps {
  isActive: boolean;
  onComplete: () => void;
}

function LineTrailAnimation({ isActive, onComplete }: LineTrailAnimationProps) {
  const strokeWidth = 6;
  const duration = 0.8;

  // Path: right 150px, down 100px, right 150px
  const radius = 5;
  const path = `M 0 ${strokeWidth / 2}
                H ${150 - radius}
                Q ${150} ${strokeWidth / 2} ${150} ${strokeWidth / 2 + radius}
                V ${100 - radius}
                Q ${150} ${100} ${150 + radius} ${100}
                H 300`;

  // Create comet particles - each slightly delayed to form a trail
  const particleCount = 20;
  const particles = Array.from({ length: particleCount }, (_, i) => {
    const progress = i / particleCount;
    // Interpolate from white (head) through pink to purple (tail)
    const color = progress < 0.2 ? "#ffffff" : progress < 0.5 ? "#ec4899" : "#a855f7";
    const opacity = 1 - progress * 0.9;
    const delay = i * 0.02; // Stagger each particle
    return { id: `particle-${i}`, color, opacity, delay };
  });

  // Trigger onComplete when animation finishes
  useEffect(() => {
    if (!isActive) return;
    const lastParticleDelay = particles[particles.length - 1].delay;
    const timeout = setTimeout(() => {
      onComplete();
    }, (duration + lastParticleDelay) * 1000);
    return () => clearTimeout(timeout);
  }, [isActive, onComplete, duration, particles]);

  return (
    <div className="relative" style={{ width: 300, height: 100 + strokeWidth }}>
      <svg
        width="300"
        height={100 + strokeWidth}
        className="absolute inset-0"
        fill="none"
      >
        {/* Background pipe */}
        <path
          d={path}
          stroke="#374151"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Comet particles - using foreignObject to enable CSS offset-path */}
        {isActive &&
          particles.map((particle) => (
            <foreignObject key={particle.id} x="0" y="0" width="300" height={100 + strokeWidth}>
              <motion.div
                style={{
                  width: strokeWidth,
                  height: strokeWidth,
                  borderRadius: "50%",
                  backgroundColor: particle.color,
                  opacity: particle.opacity,
                  offsetPath: `path('${path.replace(/\s+/g, " ")}')`,
                  offsetRotate: "0deg",
                }}
                initial={{ offsetDistance: "0%" }}
                animate={{ offsetDistance: "100%" }}
                transition={{
                  duration,
                  ease: "easeInOut",
                  delay: particle.delay,
                }}
              />
            </foreignObject>
          ))}
      </svg>
    </div>
  );
}

interface VerticalCarouselProps {
  items: string[];
  isActive: boolean;
  onComplete: () => void;
}

function VerticalCarousel({ items, isActive, onComplete }: VerticalCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const transitionDuration = 0.5;

  useEffect(() => {
    if (!isActive) return;
    // Advance to next item
    setCurrentIndex((prev) => (prev + 1) % items.length);
    // Call onComplete after transition finishes
    const timeout = setTimeout(() => {
      onComplete();
    }, transitionDuration * 1000);
    return () => clearTimeout(timeout);
  }, [isActive, items.length, onComplete]);

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
          transition={{ duration: transitionDuration, ease: "easeInOut" }}
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
