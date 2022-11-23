import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/router";
import { FC, useEffect } from "react";
import { Github } from "../assets/icons/Github";
import Button from "../buttons/Button";
import {
  useInstallations,
  USE_INSTALLATIONS_QUERY,
} from "../hooks/useInstallations";
import { DashboardLayout } from "../layout/DashboardLayout";
import { Header } from "../organization/shared";
import { withInstallations } from "../views/withInstallations";

interface HomeViewProps {
  syncGithub?: boolean;
}

const HomeView: FC<HomeViewProps> = ({ syncGithub }) => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useInstallations();
  const router = useRouter();

  useEffect(() => {
    if (syncGithub) {
      queryClient.refetchQueries([USE_INSTALLATIONS_QUERY]);
    }
  }, []);

  return (
    <DashboardLayout title="Home">
      {data && data.total_count < 0 ? (
        <>
          <Header>Onboarding</Header>
          <div className="mt-8 space-y-6">
            <p className="">Welcome to Review Corral! Lets get you setup.</p>
            <div className="p-4 rounded-md border border-gray-200 max-w-2xl space-y-4">
              <div className="flex flex-row items-center gap-2 text-lg font-semibold">
                <Github className="h-5 w-5" />
                Install the Review Corral Github App
              </div>
              <p className="font-normal text-sm">
                Click the button below to install the Github App into any of the
                Github Orgnizations and repositories you want to receive events
                for. Even if you have installed the app for all repositories in
                an organization, you can still toggle which repositories to
                listen to events to in this dashboard at any time.
              </p>
              <div className="flex gap-2">
                <Button
                  color="indigo"
                  onClick={() =>
                    router.push("https://github.com/apps/review-corral")
                  }
                >
                  Install Integration
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <Header>Your Organizations</Header>
          <p className="mt-1">
            Here are the organizations you&apos;ve installed the Review Corral
            bot on in Github
          </p>
          <div className="mt-8 inline-flex flex-col gap-2">
            {data?.installations.map((installation) => (
              <Link
                key={installation.id}
                href={`/org/${installation.account.id}`}
              >
                <div className="inline-flex items-center space-x-2 w-72 cursor-pointer rounded-md p-4 border border-gray-200 hover:shadow-sm">
                  <div className="rounded-md overflow-hidden">
                    <img
                      alt={"Avatar url"}
                      src={installation.account.avatar_url}
                      width={32}
                      height={32}
                    />
                  </div>
                  <div>{installation.account.login}</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default withInstallations(HomeView);
