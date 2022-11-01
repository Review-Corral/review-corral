import { FC } from "react";
import { ErrorAlert } from "../../common/alerts/Error";
import { Toggle } from "../../common/Toggle";
import {
  useGetInstallationRepos,
  useMutateInstallationRepo,
} from "./useGetInstallationRepos";

interface InstalledReposContentProps {
  installationId: number;
}

export const InstalledReposContent: FC<InstalledReposContentProps> = ({
  installationId,
}) => {
  const getInstalledRepos = useGetInstallationRepos(installationId);
  const mutateRepo = useMutateInstallationRepo({ installationId });

  if (getInstalledRepos.isLoading) {
    return <div>Loading installed &amp; repods</div>;
  }

  if (getInstalledRepos.error) {
    return <ErrorAlert message={"Error getting installed repositories"} />;
  }

  if (!getInstalledRepos.data || getInstalledRepos.data.length === 0) {
    return <div>No installed repositories found</div>;
  }

  const installedRepos = getInstalledRepos.data;

  return (
    <div>
      <div className="space-y-2 max-w-lg">
        {installedRepos.map((repository) => {
          return (
            <div
              key={repository.id}
              className="flex flex-row items-center justify-between"
            >
              <div>{repository.repository_name}</div>
              <Toggle
                isEnabled={repository.is_active}
                onToggle={(isEnabled) => {
                  mutateRepo.mutate({
                    repositoryId: repository.repository_id,
                    isActive: isEnabled,
                  });
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
