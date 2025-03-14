import { Button } from "@/components/shadcn/button";
import Link from "next/link";
import { ClientModal } from "./imageModel";

export default function LandingPage() {
  return (
    <div className="text-gray-900">
      <main className="container mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row items-center text-center md:text-left justify-between mb-10">
          <div className="md:w-1/2 mb-8 md:mb-0 pr-8">
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6">
              Threaded Slack Notifications for GitHub Pull Requests
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-2 md:mb-8">
              Review Corral threads your Github pull requests notifications in Slack,
              keeping notifications relevant and reducing noise.
            </p>
            <div className="hidden md:flex">
              <Link href="/app">
                <Button size="lg" className="bg-black hover:bg-gray-800 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>

          <ClientModal />
          <div className="md:hidden mt-8">
            <Link href="/app">
              <Button size="lg" className="bg-black hover:bg-gray-800 text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
