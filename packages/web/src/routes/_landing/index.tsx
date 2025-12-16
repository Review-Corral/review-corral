import { Button } from "@components/shadcn/button";
import { CTASection } from "@/components/landing/CTASection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PricingSection } from "@/components/landing/PricingSection";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_landing/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="text-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 -z-10" />

        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left: Copy */}
            <div className="lg:w-1/2 text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
                Threaded Slack Notifications for{" "}
                <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                  GitHub PRs
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0">
                Review Corral threads your GitHub pull request notifications in Slack,
                keeping your team informed without the noise.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/app">
                  <Button
                    size="lg"
                    className="bg-gray-900 hover:bg-gray-800 text-white gap-2 w-full sm:w-auto"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <a
                  href="https://github.com/Review-Corral/review-corral"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 w-full sm:w-auto"
                  >
                    View on GitHub
                  </Button>
                </a>
              </div>
            </div>

            {/* Right: Screenshot */}
            <div className="lg:w-1/2 flex justify-center">
              <div className="relative">
                {/* Shadow/glow effect behind image */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl blur-2xl opacity-50 transform scale-95" />
                <img
                  src="/rc_example_1.png"
                  alt="Review Corral showing threaded PR notifications in Slack"
                  className="relative rounded-xl shadow-2xl max-w-full h-auto border border-gray-200"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* How It Works Section */}
      <HowItWorks />

      {/* Screenshot Showcase */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              See it in action
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every PR gets its own thread. Comments, reviews, approvals, and status
              updates all appear in one place.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <img
              src="/rc_example_1_full.png"
              alt="Full view of Review Corral notifications in Slack"
              className="rounded-xl shadow-2xl border border-gray-200"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* CTA Section */}
      <CTASection />
    </div>
  );
}
