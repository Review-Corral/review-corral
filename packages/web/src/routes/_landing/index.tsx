import { Button } from "@components/shadcn/button";
import { Link, createFileRoute } from "@tanstack/react-router";
import { PipeAnimationDemo } from "@/components/landing/PipeAnimation";

export const Route = createFileRoute("/_landing/")({
  component: LandingPage,
});

function LandingPage() {
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
            <p className="text-lg md:text-xl text-gray-400 mb-8">
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
                  className="text-gray-300 border-gray-600 bg-transparent hover:bg-gray-800 hover:text-white w-full sm:w-auto"
                >
                  See how it works
                </Button>
              </a>
            </div>
          </div>

          {/* Right: Animation (desktop) / Screenshot (mobile) */}
          <div className="md:w-1/2 flex justify-center">
            <div className="hidden md:block">
              <PipeAnimationDemo />
            </div>
            <div className="md:hidden">
              <img
                src="/rc-main-example.png"
                alt="Review Corral threaded notifications example"
                className="rounded-lg shadow-lg max-w-full h-auto"
              />
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="py-16 border-t border-gray-800">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-12">
            Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              title="Personal Notifications"
              description="Get DMs for PR events that matter to you — reviews requested, approvals, comments, and more."
              imageSrc="/rc-dm-example.png"
              imageAlt="Personal DM notifications example"
            />
            <FeatureCard
              title="Repository Mappings"
              description="Connect your GitHub repositories to specific Slack channels for organized, contextual updates."
              imageSrc="/repository-mappings.png"
              imageAlt="Repository to Slack channel mappings"
            />
            <FeatureCard
              title="User Mappings"
              description="Map GitHub users to their Slack accounts so notifications reach the right person every time."
              imageSrc="/user-mappings.png"
              imageAlt="GitHub to Slack user mappings"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  imageSrc,
  imageAlt,
}: {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
      <img
        src={imageSrc}
        alt={imageAlt}
        className="rounded-lg mb-4 w-full h-auto"
      />
      <h3 className="text-lg font-semibold text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}
