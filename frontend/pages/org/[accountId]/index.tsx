import { withPageAuth } from "@supabase/auth-helpers-nextjs";
import type { NextPage } from "next";
import { Github } from "../../../components/assets/icons/Github";
import { Slack } from "../../../components/assets/icons/Slack";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { InstalledRepos } from "../../../components/teams/repos/InstalledRepos";
import { SlackIntegrations } from "../../../components/teams/slack/SlackIntegrations";
import { flattenParam } from "../../../components/utils/flattenParam";
import { Database } from "../../../database-types";

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];

export const OrgView: NextPage<{ organization: Organization }> = ({
  organization,
}) => {
  return (
    <DashboardLayout
      title={organization.account_name}
      activeOrganizationAccountId={organization.account_id}
    >
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-x-64 mt-6">
        <div className="flex grow basis-6/12 flex-col space-y-6">
          <div className="rounded-md border border-gray-200">
            <div className="flex p-4 bg-gray-100 rounded-t-md justify-between">
              <Github className="h-8 w-8 fill-black" />
              <span className="font-semibold text-lg">Github Integration</span>
            </div>
            <div className="px-4 py-6">
              {/* TODO: should we be using this installation ID actually? */}
              <InstalledRepos installationId={organization.installation_id} />
            </div>
          </div>
          π
        </div>
        <div className="grow basis-6/12 flex flex-col space-y-6 min-w-[20rem]">
          <div className="rounded-md border border-gray-200">
            <div className="flex p-4 bg-gray-100 rounded-md justify-between">
              <Slack className="h-8 w-8 fill-black" />
              <span className="font-semibold text-lg">Slack Integration</span>
            </div>
            <div className="px-4 py-6">
              <SlackIntegrations organizationId={organization.id} />
            </div>
          </div>
        </div>
      </div>
      {/* <div className="mt-6">
        <UsernameMappings teamId={teamId} />
      </div> */}
    </DashboardLayout>
  );
};

export default OrgView;

export const getServerSideProps = withPageAuth<Database, "public">({
  redirectTo: "/login",
  async getServerSideProps(ctx, supabaseClient) {
    const accountId = flattenParam(ctx.params?.["accountId"]);

    if (!accountId) {
      return {
        notFound: true,
      };
    }

    const { data, error } = await supabaseClient
      .from("organizations")
      .select("*")
      .eq("account_id", accountId);

    if (error) {
      throw Error(error.message);
    }

    if (!data || data.length === 0) {
      return {
        notFound: true,
      };
    }

    return { props: { organization: data[0] } };
  },
});
