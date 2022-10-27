import { withPageAuth } from "@supabase/auth-helpers-nextjs";
import type { NextPage } from "next";
import { Github } from "../../components/assets/icons/Github";
import { useInstallations } from "../../components/hooks/useInstallations";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { InstalledRepos } from "../../components/teams/repos/InstalledRepos";
import { Database } from "../../database-types";

export const OrgView: NextPage<{ orgId: string }> = ({ orgId }) => {
  const installations = useInstallations();

  return (
    <DashboardLayout title={"Org View"}>
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-x-64 mt-6">
        <div className="flex grow basis-6/12 flex-col space-y-6">
          <div className="rounded-md border border-gray-200">
            <div className="flex p-4 bg-gray-100 rounded-t-md justify-between">
              <Github className="h-8 w-8 fill-black" />
              <span className="font-semibold text-lg">Github Integration</span>
            </div>
            <div className="px-4 py-6">
              <InstalledRepos teamId={teamId} />
            </div>
          </div>
        </div>
        <div className="grow basis-6/12 flex flex-col space-y-6 min-w-[20rem]">
          <div className="rounded-md border border-gray-200">
            {/* <div className="flex p-4 bg-gray-100 rounded-md justify-between">
              <Slack className="h-8 w-8 fill-black" />
              <span className="font-semibold text-lg">Slack Integration</span>
            </div>
            <div className="px-4 py-6">
              <SlackIntegrations teamId={teamId} />
            </div> */}
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
  async getServerSideProps(ctx, _) {
    const orgId = ctx.params?.["orgId"];

    return { props: { orgId } };
  },
});
