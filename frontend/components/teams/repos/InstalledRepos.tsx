import { FC } from "react";
import { InstalledReposContent } from "./InstalledReposContent";

interface InstalledReposProps {
  teamId: string;
}

export const InstalledRepos: FC<InstalledReposProps> = ({ teamId }) => {
  return (
    <div>
      <h3 className="text-xl pb-2">Installed Repositories:</h3>
      <InstalledReposContent teamId={teamId} />
    </div>
  );
};
