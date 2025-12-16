import { Button } from "@components/shadcn/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { FC } from "react";

export const CTASection: FC = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to organize your PR notifications?
        </h2>
        <p className="text-lg text-gray-300 mb-8 max-w-xl mx-auto">
          Join teams who have already simplified their code review workflow with Review
          Corral.
        </p>

        <Link to="/app">
          <Button
            size="lg"
            className="bg-white text-gray-900 hover:bg-gray-100 gap-2 text-base px-8"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>

        <p className="text-sm text-gray-400 mt-6">
          Open source &bull; Free trial available
        </p>
      </div>
    </section>
  );
};
