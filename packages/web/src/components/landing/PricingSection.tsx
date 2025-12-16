import { Button } from "@components/shadcn/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { FC } from "react";

const features = [
  "Threaded PR notifications",
  "Direct message alerts",
  "Approval tracking",
  "Reviewer request notifications",
  "Up to 10 users per organization",
  "Unlimited repositories",
];

export const PricingSection: FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            One plan with everything you need. No hidden fees, no surprises.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Team Plan
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-gray-900">$10</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-gray-500 mt-2">per organization</p>
              </div>

              <ul className="space-y-3 mb-8">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/app">
                <Button
                  size="lg"
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white gap-2"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
