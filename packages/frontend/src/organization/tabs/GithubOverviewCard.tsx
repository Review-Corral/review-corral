import { Button } from "@components/ui/button";
import { ErrorCard } from "@components/ui/cards/ErrorCard";
import { Switch } from "@components/ui/switch";
import { Organization } from "@core/dynamodb/entities/types";
import { Github } from "lucide-react";
import { FC } from "react";
import toast from "react-hot-toast";
import Xarrow from "react-xarrows";
import { useSetRepoActive } from "src/github/useRepos";
import { useOrganizationRepositories } from "src/org/useOrgRepos";
import { useSlackIntegrations } from "src/slack/useSlackIntegrations";
import { OrgViewProps } from "./shared";

interface GithubCardProps extends OrgViewProps {
  organization: Organization;
  onEdit: () => void;
}

export const GithubCard: FC<GithubCardProps> = ({ organization, onEdit }) => {
  return (
    <div id="github" className="w-96">
      <div className="flex py-4 border-b border-gray-300 rounded-t-md justify-between items-center">
        <div className="flex gap-4 items-center">
          <Github className="h-8 w-8 fill-black" />
          <span className="font-semibold text-lg">Enabled Repositories</span>
        </div>
        <div
          className="cursor-pointer underline text-indigo-500 underline-offset-2"
          onClick={() => onEdit()}
        >
          Edit
        </div>
      </div>
      <div className="py-6">
        <GithubCardData organization={organization} onEdit={onEdit} />
      </div>
    </div>
  );
};

interface GithubCardDataProps {
  organization: Organization;
  onEdit: () => void;
}

const GithubCardData: FC<GithubCardDataProps> = ({ organization, onEdit }) => {
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
          Configure your repositories below to tell Review Corral which repositories to
          post events for and which ones to ignore.
        </span>
        <Button onClick={onEdit}>Setup Github Repositories</Button>
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
            {slackData != undefined && slackData.length > 0 && repo.isEnabled && (
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
