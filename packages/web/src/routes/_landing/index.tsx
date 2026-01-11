import { Button } from "@components/shadcn/button";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_landing/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="text-gray-900">
      <main className="container mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row items-center text-center md:text-left justify-between mb-10">
          <div className="md:w-1/2 mb-8 md:mb-0 pr-8">
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6">
              Linear-like notifications for Github PRs
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-2 md:mb-8">
              Review Corral organizes Github PR notifications in Slack for all of the
              users in your organization to minimize noise while keeping the
              notifications relevant.
            </p>
            <div className="hidden md:flex gap-4">
              <Link to="/app">
                <Button size="lg" className="bg-black hover:bg-gray-800 text-white">
                  Get Started
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline">
                  See how it works
                </Button>
              </a>
            </div>
          </div>

          <div className="md:w-1/2 flex justify-center">
            <img
              src="/rc-main-example.png"
              alt="Review Corral threaded notifications example"
              className="rounded-lg shadow-lg max-w-full h-auto"
            />
          </div>

          <div className="md:hidden mt-8 flex flex-col gap-4">
            <Link to="/app">
              <Button size="lg" className="bg-black hover:bg-gray-800 text-white w-full">
                Get Started
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="w-full">
                See how it works
              </Button>
            </a>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="py-16 border-t border-gray-200">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Features</h2>

          <TabGroup vertical className="flex flex-col md:flex-row gap-8">
            <TabList className="flex flex-col gap-2 md:w-1/3">
              <Tab className="text-left px-6 py-4 rounded-lg transition-colors data-[selected]:bg-gray-100 data-[selected]:font-semibold hover:bg-gray-50 focus:outline-none">
                <div className="text-lg font-medium">Personal Notifications</div>
                <p className="text-sm text-gray-600 mt-1">
                  Get DMs for events that matter to you
                </p>
              </Tab>
              <Tab className="text-left px-6 py-4 rounded-lg transition-colors data-[selected]:bg-gray-100 data-[selected]:font-semibold hover:bg-gray-50 focus:outline-none">
                <div className="text-lg font-medium">Repository Mappings</div>
                <p className="text-sm text-gray-600 mt-1">
                  Connect repositories to Slack channels
                </p>
              </Tab>
              <Tab className="text-left px-6 py-4 rounded-lg transition-colors data-[selected]:bg-gray-100 data-[selected]:font-semibold hover:bg-gray-50 focus:outline-none">
                <div className="text-lg font-medium">User Mappings</div>
                <p className="text-sm text-gray-600 mt-1">
                  Map GitHub users to Slack users
                </p>
              </Tab>
            </TabList>

            <TabPanels className="md:w-2/3">
              <TabPanel>
                <img
                  src="/rc-dm-example.png"
                  alt="Personal DM notifications example"
                  className="rounded-lg shadow-lg max-w-full h-auto"
                />
              </TabPanel>
              <TabPanel>
                <img
                  src="/repository-mappings.png"
                  alt="Repository to Slack channel mappings"
                  className="rounded-lg shadow-lg max-w-full h-auto"
                />
              </TabPanel>
              <TabPanel>
                <img
                  src="/user-mappings.png"
                  alt="GitHub to Slack user mappings"
                  className="rounded-lg shadow-lg max-w-full h-auto"
                />
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </section>
      </main>
    </div>
  );
}
