import { FC } from "react";
import { InstalledReposContent } from "./InstallationRepositories";

interface InstalledReposProps {
  installationId: number;
}

export const InstalledRepos: FC<InstalledReposProps> = ({ installationId }) => {
  return (
    <div className="space-y-8">
      <div className="max-w-lg">
        <h3 className="text-base font-bold pb-2">Installed Repositories:</h3>
        <p>
          These are repositories that you have installed the Github App onto.
          Toggle the repositories on to enable Github events to be sent to
          Slack.
        </p>
      </div>

      <InstalledReposContent installationId={installationId} />
    </div>
  );
};
