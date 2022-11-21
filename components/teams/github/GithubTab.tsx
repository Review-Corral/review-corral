import { FC } from "react";
import { Organization } from "../../../pages/org/[accountId]/[[...page]]";
import { Github } from "../../assets/icons/Github";
import { InstalledRepos } from "../repos/InstallationRepositoriesWrapper";

interface GithubTabProps {
  organization: Organization;
}

export const GithubTab: FC<GithubTabProps> = ({ organization }) => {
  return (
    <div id="github">
      <h1 className="text-xl font-semibold">Github</h1>
      <div className="rounded-md border border-gray-200">
        <div className="flex p-4 bg-gray-100 rounded-t-md justify-between">
          <Github className="h-8 w-8 fill-black" />
          <span className="font-semibold text-lg">Github Integration</span>
        </div>
        <div className="px-4 py-6">
          <InstalledRepos installationId={organization.installation_id} />
        </div>
      </div>
    </div>
  );
};
