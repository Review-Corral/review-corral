import { FC } from "react";
import { GithubCard as GithubOverviewCard } from "./GithubOverviewCard";
import { SharedLayout } from "./SharedLayout";
import { SlackOverviewCard } from "./slack/SlackOverviewCard";
import { OrgViewProps } from "./shared";

interface OverviewProps extends OrgViewProps {}

export const OverviewTab: FC<OverviewProps> = ({ organization }) => {
  return (
    <SharedLayout title="Overview">
      <GithubOverviewCard
        organization={organization}
        onEdit={() => window.alert("todo")}
      />
      <SlackOverviewCard organization={organization} />
    </SharedLayout>
  );
};
