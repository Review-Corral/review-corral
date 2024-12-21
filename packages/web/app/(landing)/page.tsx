import { Button } from "@/components/shadcn/button";
import {
  DialogHeader,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Dialog,
} from "@/components/shadcn/dialog";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="text-gray-900">
      <main className="container mx-auto px-4 py-16">
        <Dialog>
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
              <DialogTrigger className="cursor-zoom-in">
                <div className="max-w-md md:max-w-fit bg-gray-200 rounded-lg flex items-center justify-center">
                  <img
                    height={400}
                    width={600}
                    src="/rc_example_1.png"
                    alt="Review Corral Example 1"
                  />
                </div>
              </DialogTrigger>
            </div>
          </div>
          <DialogContent className="max-w-screen-md md:max-w-screen-lg bg-gray-200">
            <div className="p-2">
              <img src="/rc_example_1_full.png" alt="Review Corral Example 1 Full" />
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
