import type { NextPage } from "next";
import { Organization } from ".";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { InstalledRepos } from "../../../components/teams/repos/InstallationRepositoriesWrapper";
import { useGetInstallationRepos } from "../../../components/teams/repos/useGetInstallationRepos";
import { flattenParam } from "../../../components/utils/flattenParam";
import { withPageAuth } from "../../../components/utils/withPageAuth";

export const GithubScreen: NextPage<{ organization: Organization }> = ({
  organization,
}) => {
  const getInstalledRepos = useGetInstallationRepos(
    organization.installation_id,
  );

  return (
    <DashboardLayout title="Github">
      <InstalledRepos installationId={organization.installation_id} />
    </DashboardLayout>
  );
};

export default GithubScreen;

export const getServerSideProps = withPageAuth<"public">({
  async getServerSideProps(ctx, supabaseClient) {
    const accountId = flattenParam(ctx.params?.["accountId"]);

    if (!accountId) {
      return {
        notFound: true,
      };
    }

    const { data: organization, error } = await supabaseClient
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

    return { props: { organization } };
  },
});
