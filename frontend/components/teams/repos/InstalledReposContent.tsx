import { FC } from "react";
import { Toggle } from "../../common/Toggle";
import { useGetInstallationRepos } from "./useGetInstallationRepos";

interface InstalledReposContentProps {
  installationId: number;
}

export const InstalledReposContent: FC<InstalledReposContentProps> = ({
  installationId,
}) => {
  const getInstalledRepos = useGetInstallationRepos(installationId);
  // const getSyncedRepos = useGetSyncedRepos(installationId);
  // const syncRepo = useSyncRepo(installationId);
  // const deleteSyncedRepo = useDeleteSyncedRepo(installationId);

  // if (getSyncedRepos.isLoading && getInstalledRepos.isLoading) {
  //   return <div>Loading installed &amp; repods</div>;
  // }

  // if (getInstalledRepos.error) {
  //   return (
  //     <ErrorAlert
  //       message={"Error getting installed repositories"}
  //       subMessage={
  //         getInstalledRepos.error.response?.status === 401 && (
  //           <>
  //             Try{" "}
  //             <a
  //               className="underline cursor-pointer"
  //               href={getGithubAuthorizationUrl(installationId).toString()}
  //             >
  //               re-authenticating
  //             </a>
  //           </>
  //         )
  //       }
  //     />
  //   );
  // }

  if (!getInstalledRepos.data || getInstalledRepos.data.length === 0) {
    return <div>No installed repositories found</div>;
  }

  // if (!getSyncedRepos.data) {
  //   throw Error("Finding synchronized repos failed.");
  // }

  const installedRepos = getInstalledRepos.data;
  // const syncedRepos = getSyncedRepos.data;

  return (
    <div>
      <div className="space-y-2 max-w-lg">
        {installedRepos.map((repository) => {
          // const syncedRepo = syncedRepos.find(
          //   (s) => s.repository_id === repository.id.toString(),
          // );
          return (
            <div key={repository.id} className="grid grid-cols-2">
              <div>{repository.repository_name}</div>
              <Toggle
                isEnabled={true}
                // isEnabled={!!syncedRepo}
                onToggle={(isEnabled) => {
                  // if (isEnabled) {
                  //   syncRepo
                  //     .mutateAsync({
                  //       teamId,
                  //       repositoryName: repo.name,
                  //       repositoryId: repo.id,
                  //       installationId: installation.installationId,
                  //     })
                  //     .catch(() => toast.error("Error turning on repo"));
                  // } else {
                  //   deleteSyncedRepo
                  //     .mutateAsync({ repoId: repo.id.toString() })
                  //     .catch(() => toast.error("Error turning off repo"));
                  // }
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
