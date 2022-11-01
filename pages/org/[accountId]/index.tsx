import { withPageAuth } from "@supabase/auth-helpers-nextjs";
import type { NextPage } from "next";
import { Github } from "../../../components/assets/icons/Github";
import { Slack } from "../../../components/assets/icons/Slack";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { InstalledRepos } from "../../../components/teams/repos/InstallationRepositoriesWrapper";
import { SlackIntegrations } from "../../../components/teams/slack/SlackIntegrations";
import { UsernameMappings } from "../../../components/teams/slack/username-mappings/UsernameMappings";
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
              <InstalledRepos installationId={organization.installation_id} />
            </div>
          </div>
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
      <div className="mt-6">
        <UsernameMappings organizationId={organization.id} />
      </div>
    </DashboardLayout>
  );
};

export default OrgView;

export const getServerSideProps = withPageAuth<Database, "public">({
  redirectTo: "/login",
  async getServerSideProps(ctx, supabaseClient) {
    console.log("In get server side props");
    const accountId = flattenParam(ctx.params?.["accountId"]);

    if (!accountId) {
      return {
        notFound: true,
      };
    }

    const { data, error } = await supabaseClient
      .from("organizations")
      .select("*")
      .eq("account_id", accountId)
      .limit(1)
      .single();

    if (error) {
      console.info(
        "Got error getting organization by account ID ",
        accountId,
        ": ",
        error,
      );
      return {
        notFound: true,
      };
    }

    return { props: { organization: data } };
  },
});
