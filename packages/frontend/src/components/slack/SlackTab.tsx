import { FC } from "react";
import { ErrorAlert } from "../../common/alerts/Error";
import { ActiveLight } from "../../common/misc/activeLight";
import { Header, OrgViewProps } from "../shared";
import { SetupSlackCard } from "./SetupSlackCard";
import { useSlackIntegrations } from "./useSlackIntegrations";

export const SlackTab: FC<OrgViewProps> = ({ organization }) => {
  const slackIntegration = useSlackIntegrations({
    organizationId: organization.id,
  });

  const slackTable = (
    <div className="mt-8 flex flex-col">
      <div className="overflow-x-auto -mx-6">
        <div className="inline-block min-w-full py-2 align-middle px-6">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                  >
                    Channel Name
                  </th>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                  >
                    Slack Team
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
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {slackIntegration.isLoading ? (
                  <>
                    {Array.from(Array(3).keys()).map((num) => (
                      <tr key={num}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <div className="h-6 w-[80%] rounded-lg bg-gray-200 animate-pulse" />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
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
                    {slackIntegration.data?.map((channel) => (
                      <tr key={channel.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {channel.channel_name}
                        </td>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                          {channel.slack_team_name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(channel.updated_at!).toLocaleString()}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-sm font-medium sm:pr-6">
                          <div className="flex items-center justify-end gap-4">
                            <ActiveLight />
                            <span>Active</span>
                          </div>
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
  );

  return (
    <div className="space-y-12">
      <Header>Slack</Header>
      {slackIntegration.error ? (
        <ErrorAlert
          message={"There was an unexpected error fetching your Slack data"}
        />
      ) : !slackIntegration.isLoading &&
        (!slackIntegration.data || slackIntegration.data?.length < 1) ? (
        <SetupSlackCard organization={organization} />
      ) : (
        slackTable
      )}
    </div>
  );
};
