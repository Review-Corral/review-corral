import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Loading } from "@components/ui/cards/loading";
import { OverviewTab } from "@/components/dashboard/tabs/OverviewTab";
import { BillingTab } from "@/components/dashboard/tabs/billing/BillingTab";
import { UsersTab } from "@/components/dashboard/tabs/users/UsersTab";
import { useOrganization } from "@/hooks/useOrganization";

const searchSchema = z.object({
  page: z.enum(["billing", "users", "overview"]).optional().default("overview"),
});

export const Route = createFileRoute("/app/_dashboard/org/$orgId/")({
  validateSearch: searchSchema,
  component: OrgView,
});

function OrgView() {
  const { orgId } = Route.useParams();
  const { page } = Route.useSearch();

  const orgIdNumber = Number(orgId);
  const { data: organization, isLoading } = useOrganization(orgIdNumber);

  if (isLoading) return <Loading />;

  if (!organization) {
    return <div>No Organization found</div>;
  }

  switch (page) {
    case "users":
      return <UsersTab organization={organization} />;
    case "billing":
      return <BillingTab orgId={orgIdNumber} />;
    default:
      return <OverviewTab organization={organization} />;
  }
}
