import { FC } from "react";
import { GithubCard as GithubOverviewCard } from "./GithubOverviewCard";
import { SharedLayout } from "./SharedLayout";
import { OrgViewProps } from "./shared";
import { SlackOverviewCard } from "./slack/SlackOverviewCard";

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
