import { Header } from "@/components/ui/header";
import { useOrganization } from "@/lib/fetchers/organizations";
import { GithubCard } from "../GithubOverviewCard";
import { OrgViewPage, orgViewPathSchema } from "../types";

const page: OrgViewPage = async function OverviewPage({ params }) {
  const { orgId } = orgViewPathSchema.parse(params);
  const organization = await useOrganization(orgId);

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
};

export default page;
