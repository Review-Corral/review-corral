"use client";

import { Switch } from "@components/shadcn/switch";
import { ErrorCard } from "@components/ui/cards/ErrorCard";
import { Organization } from "@core/dynamodb/entities/types";
import { Github } from "lucide-react";
import { FC } from "react";
import toast from "react-hot-toast";
import Xarrow from "react-xarrows";
import { OrgViewProps } from "../shared";
import { useSlackIntegrations } from "../slack/useSlackIntegrations";
import { useOrganizationRepositories, useSetRepoActive } from "./useRepos";

interface GithubCardProps extends OrgViewProps {
  organization: Organization;
}

export const GithubCard: FC<GithubCardProps> = ({ organization }) => {
  return (
    <div id="github" className="w-96">
      <div className="flex py-4 border-b border-gray-300 rounded-t-md justify-between items-center">
        <div className="flex gap-4 items-center">
          <Github className="h-8 w-8 fill-black" />
          <span className="font-semibold text-lg">Repositories</span>
        </div>
      </div>
      <div className="py-6">
        <GithubCardData organization={organization} />
      </div>
    </div>
  );
};

interface GithubCardDataProps {
  organization: Organization;
}

const GithubCardData: FC<GithubCardDataProps> = ({ organization }) => {
  const getInstalledRepos = useOrganizationRepositories(organization.orgId);
  const { data: slackData } = useSlackIntegrations(organization.orgId);

  const setRepoActive = useSetRepoActive();

  if (getInstalledRepos.isLoading) {
    return (
      <div>
        <div className="space-y-4">
          {Array.from(Array(3).keys()).map((num) => (
            <div
              key={num}
              className="flex flex-row animate-pulse p-4 rounded-md bg-gray-100 text-gray-100"
            >
              <div className="truncate">{num}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (getInstalledRepos.isError) {
    return <ErrorCard message="Error loading your Github integration" />;
  }

  if (!getInstalledRepos.data || getInstalledRepos.data.length === 0) {
    return <ErrorCard message="You need to setup your integration!" />;
  }

  const activeRepos = getInstalledRepos.data;

  if (activeRepos.length < 1) {
    return (
      <div className="p-4 border border-grey-200 rounded-md space-y-6 max-w-xl">
        <span>
          It looks like we couldn't detect any repositories for this organization.
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2">
        {activeRepos.map((repo) => (
          <div key={repo.repoId.toString()}>
            <div
              className="flex flex-row gap-4 items-center justify-between border border-gray-200 rounded-md p-4 bg-white"
              id={repo.repoId.toString()}
            >
              <div className="truncate">{repo.name}</div>
              <Switch
                id={repo.repoId.toString()}
                checked={repo.isEnabled}
                onClick={() => {
                  const verb = repo.isEnabled ? "disabl" : "enabl";
                  toast.promise(
                    setRepoActive.mutateAsync({
                      orgId: organization.orgId,
                      repoId: repo.repoId,
                      isEnabled: !repo.isEnabled,
                    }),
                    {
                      loading: repo.isEnabled
                        ? `${verb}ing ${repo.name}`
                        : `${verb}ing ${repo.name}`,
                      success: `${repo.name} ${verb}ed`,
                      error: `There wasn an error ${verb}ing ${repo.name}`,
                    },
                  );
                }}
              />
            </div>

            {/* TODO: in the future the target should be found from a m2m table of Github <-> slack */}
            {/* Only show the Arrows if the slack data has loaded and there's at least one entry */}
            {slackData != null && slackData.length > 0 && repo.isEnabled && (
              <Xarrow
                start={repo.repoId.toString()}
                end="slack-channel"
                showHead={false}
                color={"#6366f1"}
                strokeWidth={2}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
