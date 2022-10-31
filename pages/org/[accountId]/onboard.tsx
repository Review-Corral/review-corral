import { CheckCircleIcon } from "@heroicons/react/outline";
import { withPageAuth } from "@supabase/auth-helpers-nextjs";
import { NextPage } from "next";
import { Organization } from ".";
import { Github } from "../../../components/assets/icons/Github";
import { Slack } from "../../../components/assets/icons/Slack";
import Button from "../../../components/buttons/Button";
import GithubButton from "../../../components/GithubButton";
import { useInstallations } from "../../../components/hooks/useInstallations";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import SlackButton from "../../../components/SlackButton";
import { useSlackIntegrations } from "../../../components/teams/slack/useSlackIntegrations";
import { flattenParam } from "../../../components/utils/flattenParam";

const TeamPage: NextPage<{ organization: Organization }> = ({
  organization,
}) => {
  const githubIntegration = useInstallations();
  const slackIntegration = useSlackIntegrations({
    organizationId: organization.id,
  });

  console.log(githubIntegration.error?.response?.status);

  const connectedToGithub =
    githubIntegration.data && githubIntegration.data.total_count > 0;

  const connectedToSlack =
    slackIntegration.data &&
    slackIntegration.data.length > 0 &&
    slackIntegration.data[0].id;

  console.log(githubIntegration.data);

  return (
    <DashboardLayout title="Onboard">
      <h4>let's get your integrations setup</h4>
      <div className="flex flex-col gap-y-6 mt-6">
        <div className="flex grow basis-6/12 flex-col space-y-6">
          <div className="rounded-md border border-gray-200 flex px-4 py-8 bg-gray-100 rounded-t-md items-center justify-between">
            <div className="flex gap-4 items-center">
              <Github className="h-8 w-8 fill-black" />
              <span className="font-semibold text-base">
                Connect Review Corral with Github
              </span>
            </div>
            {connectedToGithub ? (
              <Button color="green">
                <div className="flex gap-2 items-center">
                  <CheckCircleIcon className="h-5" />
                  Connected to Github
                </div>
              </Button>
            ) : (
              <GithubButton state={organization.id} />
            )}
          </div>
        </div>
        <div className="grow basis-6/12 flex flex-col space-y-6 min-w-[20rem]">
          <div className="rounded-md border border-gray-200 flex px-4 py-8 bg-gray-100 rounded-t-md items-center justify-between">
            <div className="flex gap-4 items-center">
              <Slack className="h-8 w-8 fill-black" />
              <span className="font-semibold text-base">
                Connect Review Corral with Slack
              </span>
            </div>
            {connectedToSlack ? (
              <Button color="green">
                <div className="flex gap-2 items-center">
                  <CheckCircleIcon className="h-5" />
                  Connected to Slack
                </div>
              </Button>
            ) : (
              <SlackButton organizationId={organization.id} />
            )}
          </div>
        </div>
      </div>
      {connectedToGithub && connectedToSlack && <div>You're all setup!</div>}
    </DashboardLayout>
  );
};

export default TeamPage;

export const getServerSideProps = withPageAuth({
  redirectTo: "/login",
  async getServerSideProps(ctx, supabaseClient) {
    const accountId = flattenParam(ctx.params?.accountId);

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
