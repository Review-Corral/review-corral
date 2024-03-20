import { Header } from "@components/ui/header";
import { FC } from "react";
import { GithubCard as GithubOverviewCard } from "./GithubOverviewCard";
import { SlackOverviewCard } from "./SlackOverviewCard";
import { OrgViewProps } from "./shared";

interface OverviewProps extends OrgViewProps {}

export const OverviewTab: FC<OverviewProps> = ({ organization, onEdit: setPage }) => {
  return (
    <div className="space-y-12">
      <Header>Overview</Header>
      <div className="flex justify-between items-start">
        <GithubOverviewCard
          organization={organization}
          onEdit={() => {
            setPage("github");
          }}
        />
        <SlackOverviewCard
          organization={organization}
          onEdit={() => {
            setPage("slack");
          }}
        />
      </div>
    </div>
  );
};
