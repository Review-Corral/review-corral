import { FC } from "react";
import { ErrorAlert } from "../../common/alerts/Error";
import { Toggle } from "../../common/Toggle";
import { Header, OrgViewProps } from "../shared";
import {
  useGetInstallationRepos,
  useMutateInstallationRepo,
} from "./useGetInstallationRepos";

export const GithubTab: FC<OrgViewProps> = ({ organization }) => {
  const repos = useGetInstallationRepos(organization.installation_id);
  const mutateRepo = useMutateInstallationRepo({
    installationId: organization.installation_id,
  });
  return (
    <div className="space-y-12">
      <Header>Github</Header>

      {repos.error ? (
        <ErrorAlert
          message={"There was an unexpected error fetching your Github data"}
        />
      ) : (
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 w-[50%] text-left text-sm font-semibold text-gray-900 sm:pl-6"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Last Updated
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
                      >
                        Enabled
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 bg-white">
                    {repos.isLoading ? (
                      <>
                        {Array.from(Array(3).keys()).map((num) => (
                          <tr key={num}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              <div className="h-6 w-[80%] rounded-lg bg-gray-200 animate-pulse" />
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <div className="h-6 w-[80%] rounded-lg bg-gray-200 animate-pulse" />
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <div className="h-6 w-[80%] rounded-lg bg-gray-200 animate-pulse" />
                            </td>
                          </tr>
                        ))}
                      </>
                    ) : (
                      <>
                        {repos.data?.map((repo) => (
                          <tr key={repo.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              {repo.repository_name}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {new Date(repo.updated_at!).toLocaleString()}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <Toggle
                                isEnabled={repo.is_active}
                                onToggle={(isEnabled) => {
                                  mutateRepo.mutate({
                                    repositoryId: repo.repository_id,
                                    isActive: isEnabled,
                                  });
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
