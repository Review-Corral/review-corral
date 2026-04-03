import { Button } from "@components/shadcn/button";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

export const Route = createFileRoute("/_landing/")({
  component: LandingPage,
});

function LandingPage() {
  const [selectedCard, setSelectedCard] = useState<{
    title: string;
    description: string;
    imageSrc: string;
    imageAlt: string;
  } | null>(null);

  return (
    <div>
      <main className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-center py-16 md:py-24">
          {/* Left: Text */}
          <div className="md:w-1/2 text-center md:text-left mb-12 md:mb-0 md:pr-8">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
              Linear-like notifications for Github PRs
            </h1>
            <p className="text-lg md:text-xl text-stone-400 mb-8">
              Review Corral organizes Github PR notifications in
              Slack for all of the users in your organization to
              minimize noise while keeping the notifications
              relevant.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link to="/app">
                <Button
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
                >
                  Get Started
                </Button>
              </Link>
              <a href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-stone-300 border-stone-600 bg-transparent hover:bg-stone-800 hover:text-white w-full sm:w-auto"
                >
                  See how it works
                </Button>
              </a>
            </div>
          </div>

          {/* Right: Screenshot */}
          <div className="md:w-1/2 flex justify-center">
            <img
              src="/rc-main-example.png"
              alt="Review Corral threaded notifications example"
              className="rounded-lg shadow-lg max-w-full h-auto"
            />
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="py-16 border-t border-stone-800">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-12">
            Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              title="Personal Notifications"
              description="Get DMs for PR events that matter to you — reviews requested, approvals, comments, and more."
              imageSrc="/rc-dm-example.png"
              imageAlt="Personal DM notifications example"
              onClick={setSelectedCard}
            />
            <FeatureCard
              title="Repository Mappings"
              description="Connect your GitHub repositories to specific Slack channels for organized, contextual updates."
              imageSrc="/repository-mappings.png"
              imageAlt="Repository to Slack channel mappings"
              onClick={setSelectedCard}
            />
            <FeatureCard
              title="User Mappings"
              description="Map GitHub users to their Slack accounts so notifications reach the right person every time."
              imageSrc="/user-mappings.png"
              imageAlt="GitHub to Slack user mappings"
              onClick={setSelectedCard}
            />
          </div>
        </section>
      </main>

      {selectedCard && (
        <FeatureModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  onClick: (card: Omit<FeatureCardProps, "onClick">) => void;
}

function FeatureCard({
  title,
  description,
  imageSrc,
  imageAlt,
  onClick,
}: FeatureCardProps) {
  return (
    <button
      type="button"
      onClick={() =>
        onClick({ title, description, imageSrc, imageAlt })
      }
      className="bg-stone-900/50 border border-stone-800 rounded-xl p-6 hover:border-stone-600 transition-colors cursor-pointer text-left"
    >
      <img
        src={imageSrc}
        alt={imageAlt}
        className="rounded-lg mb-4 w-full h-auto"
      />
      <h3 className="text-lg font-semibold text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-stone-400">{description}</p>
    </button>
  );
}

function FeatureModal({
  card,
  onClose,
}: {
  card: Omit<FeatureCardProps, "onClick">;
  onClose: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-200 ${
        isVisible ? "bg-black/70" : "bg-black/0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`max-w-3xl w-full bg-stone-900 border border-stone-700 rounded-2xl p-6 shadow-2xl transition-all duration-200 ${
          isVisible
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={card.imageSrc}
          alt={card.imageAlt}
          className="rounded-lg w-full h-auto mb-4"
        />
        <h3 className="text-xl font-semibold text-white mb-2">
          {card.title}
        </h3>
        <p className="text-stone-400">{card.description}</p>
      </div>
    </div>
  );
}
