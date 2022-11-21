import { FC } from "react";
import { GithubCard } from "../../pages/org/[accountId]/[[...page]]";
import { Slack } from "../assets/icons/Slack";
import { Header, OrgViewProps } from "./shared";
import { SlackIntegrations } from "./slack/SlackIntegrations";

interface OverviewProps extends OrgViewProps {}

export const OverviewTab: FC<OverviewProps> = ({ organization, setPage }) => {
  return (
    <div className="space-y-12">
      <Header>Overview</Header>
      <div className="flex justify-between items-start">
        <div className="flex flex-wrap">
          <GithubCard
            organization={organization}
            onEdit={() => {
              setPage("github");
            }}
          />
        </div>
        <div className="rounded-md border border-gray-200 w-96">
          <div className="flex p-4 bg-gray-100 rounded-md justify-between">
            <Slack className="h-8 w-8 fill-black" />
            <span className="font-semibold text-lg">Slack Integration</span>
          </div>
          <div className="px-4 py-6">
            <SlackIntegrations organizationId={organization.id} />
          </div>
        </div>
      </div>
    </div>
  );
};
