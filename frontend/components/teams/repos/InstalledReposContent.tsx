import { FC } from "react";
import { ErrorAlert } from "../../common/alerts/Error";
import { Toggle } from "../../common/Toggle";
import { useDeleteSyncedRepo } from "./useDeleteSyncedRepo";
import { useGetInstalledRepos } from "./useGetInstalledRepos";
import { useGetSyncedRepos } from "./useGetSyncedRepos";
import { useSyncRepo } from "./useSyncRepo";

interface InstalledReposContentProps {
  teamId: string;
}

export const InstalledReposContent: FC<InstalledReposContentProps> = ({
  teamId,
}) => {
  const getInstalledRepos = useGetInstalledRepos(teamId);
  const getSyncedRepos = useGetSyncedRepos(teamId);
  const syncRepo = useSyncRepo(teamId);
  const deleteSyncedRepo = useDeleteSyncedRepo(teamId);

  if (getSyncedRepos.isLoading && getInstalledRepos.isLoading) {
    return <div>Loading installed &amp; repods</div>;
  }

  if (getInstalledRepos.error) {
    return <ErrorAlert message={"Error getting installed repositories"} />;
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
