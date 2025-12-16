import { ArrowRight, Github, MessageCircle, Slack } from "lucide-react";
import { FC } from "react";

const steps = [
  {
    icon: Github,
    title: "Install GitHub App",
    description: "Add Review Corral to your GitHub organization in just a few clicks.",
  },
  {
    icon: Slack,
    title: "Connect Slack",
    description: "Link your Slack workspace and choose which channel to post to.",
  },
  {
    icon: MessageCircle,
    title: "Get Organized",
    description: "All PR notifications arrive as threaded messages, keeping your channel clean.",
  },
];

export const HowItWorks: FC = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Get started in minutes
          </h2>
          <p className="text-lg text-gray-600">
            Three simple steps to organized PR notifications
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.title} className="flex items-center gap-4 md:gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center mb-4 shadow-lg">
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 max-w-[200px]">
                  {step.description}
                </p>
              </div>

              {index < steps.length - 1 && (
                <ArrowRight className="hidden md:block w-6 h-6 text-gray-300 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
