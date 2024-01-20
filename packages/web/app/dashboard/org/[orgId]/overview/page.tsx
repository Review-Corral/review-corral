import { Header } from "@/components/ui/header";
import { fetchOrganization } from "@/lib/fetchers/organizations";
import { GithubCard } from "../GithubOverviewCard";
import { OrgViewPathParams, orgViewPathSchema } from "../types";

export default async function OverviewPage({
  params,
}: {
  params: OrgViewPathParams;
}) {
  const { orgId } = orgViewPathSchema.parse(params);
  const organization = await fetchOrganization(orgId);

  return (
    <div className="space-y-12">
      <Header>Overview</Header>
      <div className="flex justify-between items-start">
        <GithubCard organization={organization} />
        {/* <SlackOverviewCard
          organization={organization}
          onEdit={() => {
            setPage("slack");
          }}
        /> */}
      </div>
    </div>
  );
}
