import { FC } from "react";
import { SharedLayout } from "./SharedLayout";
import { GithubCard as GithubOverviewCard } from "./github/GithubOverviewCard";
import { OrgViewProps } from "./shared";
import { SlackOverviewCard } from "./slack/SlackOverviewCard";

interface OverviewProps extends OrgViewProps {}

export const OverviewTab: FC<OverviewProps> = ({ organization }) => {
  return (
    <SharedLayout title="Overview">
      <GithubOverviewCard organization={organization} />
      <SlackOverviewCard organization={organization} />
    </SharedLayout>
  );
};
