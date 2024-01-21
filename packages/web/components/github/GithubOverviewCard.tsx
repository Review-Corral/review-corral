"use server";

import { Button } from "@/components/ui/button";
import {
  fetchRepositories,
  fetchSlackRepositories as fetchSlackIntegrations,
  setActiveRepo,
} from "@/lib/fetchers/organizations";
import { Github } from "lucide-react";
import { OrgViewProps } from "../../app/dashboard/org/[orgId]/shared";
import { RepositoryCard } from "./RepositoryCard";

interface GithubCardProps extends OrgViewProps {}

export const GithubCard = async ({ organization }: GithubCardProps) => {
  return (
    <div id="github" className="w-96">
      <div className="flex py-4 border-b border-gray-300 rounded-t-md justify-between items-center">
        <div className="flex gap-4 items-center">
          <Github className="h-8 w-8 fill-black" />
          <span className="font-semibold text-lg">Enabled Repositories</span>
        </div>
        <div className="cursor-pointer underline text-indigo-500 underline-offset-2">
          Edit
        </div>
      </div>
      <div className="py-6">
        <GithubCardData organization={organization} />
      </div>
    </div>
  );
};

const GithubCardData = async ({ organization }: GithubCardProps) => {
  const repositories = await fetchRepositories(organization.id);
  const slackIntegrations = await fetchSlackIntegrations(organization.id);

  // if (getInstalledRepos.isError) {
  //   return <ErrorCard message="Error loading your Github integration" />;
  // }

  // if (!getInstalledRepos.data || getInstalledRepos.data.length === 0) {
  //   return <ErrorCard message="You need to setup your integration!" />;
  // }

  if (repositories.length < 1) {
    return (
      <div className="p-4 border border-grey-200 rounded-md space-y-6 max-w-xl">
        <span>
          Configure your repositories below to tell Review Corral which
          repositories to post events for and which ones to ignore.
        </span>
        <Button>Setup Github Repositories</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2">
        {repositories.map((repo) => {
          const setActiveRepoWithId = setActiveRepo.bind(
            null,
            repo.id,
            !repo.isActive
          );

          return (
            <div key={repo.id.toString()}>
              <div
                className="flex flex-row gap-4 items-center justify-between border border-gray-200 rounded-md p-4 bg-white"
                id={repo.id.toString()}
              >
                <div className="truncate">{repo.name}</div>
                <form action={setActiveRepoWithId}>
                  <RepositoryCard repoId={repo.id} active={true} />
                </form>
              </div>

              {/* TODO: in the future the target should be found from a m2m table of Github <-> slack */}
              {/* Only show the Arrows if the slack data has loaded and there's at least one entry */}
              {/* {slackData != undefined &&
                slackData.length > 0 &&
                repo.isActive && (
                  <Xarrow
                    start={repo.id.toString()}
                    end="slack-channel"
                    showHead={false}
                    color={"#6366f1"}
                    strokeWidth={2}
                  />
                )} */}
            </div>
          );
        })}
      </div>
    </div>
  );
};
