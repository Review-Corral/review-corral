import { Bell, CheckCircle, MessageSquare, Users } from "lucide-react";
import { FC } from "react";
import { FeatureCard } from "./FeatureCard";

const features = [
  {
    icon: MessageSquare,
    title: "Threaded Notifications",
    description:
      "All PR activity consolidated in one organized Slack thread. No more scattered notifications cluttering your channels.",
  },
  {
    icon: Bell,
    title: "DM Notifications",
    description:
      "Get notified directly when you're mentioned, requested to review, or someone replies to your comments.",
  },
  {
    icon: CheckCircle,
    title: "Approval Tracking",
    description:
      "See approval progress at a glance. Know exactly how many approvals are needed and who has already approved.",
  },
  {
    icon: Users,
    title: "Reviewer Requests",
    description:
      "Always know who's been asked to review. Track requested reviewers directly in the Slack thread.",
  },
];

export const FeaturesSection: FC = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything you need to stay on top of PRs
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Review Corral brings all your pull request activity into organized Slack
            threads, so your team never misses an update.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
