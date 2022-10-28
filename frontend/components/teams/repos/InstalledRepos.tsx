import { FC } from "react";
import { InstalledReposContent } from "./InstalledReposContent";

interface InstalledReposProps {
  installationId: number;
}

export const InstalledRepos: FC<InstalledReposProps> = ({ installationId }) => {
  return (
    <div>
      <h3 className="text-xl pb-2">Installed Repositories:</h3>
      <InstalledReposContent installationId={installationId} />
    </div>
  );
};
