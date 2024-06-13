import { FC } from "react";
import { GithubCard as GithubOverviewCard } from "./GithubOverviewCard";
import { SharedLayout } from "./SharedLayout";
import { SlackOverviewCard } from "./SlackOverviewCard";
import { OrgViewProps } from "./shared";

interface OverviewProps extends OrgViewProps {}

export const OverviewTab: FC<OverviewProps> = ({ organization, onEdit: setPage }) => {
  return (
    <SharedLayout title="Overview">
      <GithubOverviewCard organization={organization} onEdit={() => {}} />
      <SlackOverviewCard organization={organization} onEdit={() => {}} />
    </SharedLayout>
  );
};
