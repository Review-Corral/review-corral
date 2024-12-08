import Image from "next/image";
import { ArrowRight, Slack, Github, Bell, Zap, Users } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { redirect } from "next/navigation";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="container mx-auto px-4 py-8">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Image
              height={48}
              width={48}
              src="/review_corral_logo.png"
              alt="Review Corral logo"
            />
            <span className="text-2xl font-bold text-gray-900">Review Corral</span>
          </div>
          <Link href="/app">
            <Button
              variant="outline"
              className="text-gray-900 border-gray-300 hover:bg-gray-100"
            >
              Get Started
            </Button>
          </Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10">
          <div className="md:w-1/2 mb-8 md:mb-0 pr-8">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
              Threaded Slack Notifications for GitHub Pull Requests
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Review Corral threads your Github pull requests notifications in Slack,
              keeping notifications relevant and reducing noise.
            </p>
            <div className="flex space-x-4">
              <Link href="/app">
                <Button size="lg" className="bg-black hover:bg-gray-800 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="max-w-md md:max-w-fit bg-gray-200 rounded-lg flex items-center justify-center">
              <Image
                height={400}
                width={600}
                src="/review_corral_example_1.png"
                alt="Review Corral Example 1"
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>&copy; 2024 Review Corral. All rights reserved.</p>
      </footer>
    </div>
  );
}
