"use client";

import { Loading } from "@/components/ui/cards/loading";
import { OverviewTab } from "./tabs/OverviewTab";
import { BillingTab } from "./tabs/billing/BillingTab";
import { UsersTab } from "./tabs/users/UsersTab";
import { useOrganization } from "./useOrganization";

const OrgView: React.FC<
  React.PropsWithChildren<{
    orgId: number;
    page: string;
  }>
> = ({ children, page, orgId }) => {
  const { data: organization, isLoading } = useOrganization(orgId);

  if (isLoading) return <Loading />;

  if (!organization) {
    return <div>No Organization found</div>;
  }

  switch (page) {
    case "users":
      return <UsersTab orgId={orgId} />;
    case "billing":
      return <BillingTab orgId={orgId} />;
    default:
      return <OverviewTab organization={organization} />;
  }
};

export default OrgView;
