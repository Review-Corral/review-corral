"use client";

import { Loading } from "@/components/ui/cards/loading";
import { useParams, useSearchParams } from "next/navigation";
import { z } from "zod";
import { OverviewTab } from "./tabs/OverviewTab";
import { BillingTab } from "./tabs/billing/BillingTab";
import { UsersTab } from "./tabs/users/UsersTab";
import { useOrganization } from "./useOrganization";

const orgIdSchema = z.string().transform(Number);

const OrgView: React.FC = () => {
  const searchParams = useSearchParams();

  const { orgId: orgIdString } = useParams<{ orgId: string }>();

  const page = searchParams.get("page");
  const orgId = orgIdSchema.parse(orgIdString);

  const { data: organization, isLoading } = useOrganization(orgId);

  if (isLoading) return <Loading />;

  if (!organization) {
    return <div>No Organization found</div>;
  }

  switch (page) {
    case "users":
      return <UsersTab organization={organization} />;
    case "billing":
      return <BillingTab orgId={orgId} />;
    default:
      return <OverviewTab organization={organization} />;
  }
};

export default OrgView;
