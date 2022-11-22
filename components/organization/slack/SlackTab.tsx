import { FC } from "react";
import { Header, OrgViewProps } from "../shared";
import { SlackIntegrations } from "./SlackIntegrations";

export const SlackTab: FC<OrgViewProps> = ({ organization }) => {
  return (
    <div className="space-y-12">
      <Header>Slack</Header>
      <SlackIntegrations organizationId={organization.id} />
    </div>
  );
};
