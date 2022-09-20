import { FC } from "react";
import { Toggle } from "../../common/Toggle";
import { useDeleteSyncedRepo } from "./useDeleteSyncedRepo";
import { useGetInstalledRepos } from "./useGetInstalledRepos";
import { useGetSyncedRepos } from "./useGetSyncedRepos";
import { useSyncRepo } from "./useSyncRepo";

interface InstalledReposProps {
  teamId: string;
}

export const InstalledRepos: FC<InstalledReposProps> = ({ teamId }) => {
  const getInstalledRepos = useGetInstalledRepos(teamId);
  const getSyncedRepos = useGetSyncedRepos(teamId);
  const syncRepo = useSyncRepo(teamId);
  const deleteSyncedRepo = useDeleteSyncedRepo(teamId);

  if (getSyncedRepos.isLoading && getInstalledRepos.isLoading) {
    return <div>Loading installed &amp; repods</div>;
  }

  if (!getInstalledRepos.data || getInstalledRepos.data.length === 0) {
    return <div>No installed repositories found</div>;
  }

  if (!getSyncedRepos.data) {
    throw Error("Finding synchronized repos failed.");
  }

  const installedRepos = getInstalledRepos.data;
  const syncedRepos = getSyncedRepos.data;

  return (
    <div>
      <h2 className="text-xl pb-2">Installed Repositories:</h2>
      <div className="space-y-2 max-w-lg">
        {installedRepos.map((installation) =>
          installation.repositories.map((repo) => {
            const syncedRepo = syncedRepos.find(
              (s) => s.repository_id === repo.id.toString(),
            );
            return (
              <div key={repo.id} className="grid grid-cols-2">
                <div>{repo.name}</div>
                <Toggle
                  isEnabled={!!syncedRepo}
                  onToggle={(isEnabled) => {
                    if (isEnabled) {
                      syncRepo.mutate({
                        teamId,
                        repositoryName: repo.name,
                        repositoryId: repo.id,
                        installationId: installation.installationId,
                      });
                    } else {
                      deleteSyncedRepo.mutate({ repoId: repo.id.toString() });
                    }
                  }}
                />
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
};
