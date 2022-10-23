import { CheckCircleIcon } from "@heroicons/react/outline";
import { User, withPageAuth } from "@supabase/auth-helpers-nextjs";
import { NextPage } from "next";
import { Github } from "../../../components/assets/icons/Github";
import { Slack } from "../../../components/assets/icons/Slack";
import Button from "../../../components/buttons/Button";
import GithubButton from "../../../components/GithubButton";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import SlackButton from "../../../components/SlackButton";
import { useGithubIntegration } from "../../../components/teams/github/useGetGithubIntegration";
import { useSlackIntegrations } from "../../../components/teams/slack/useSlackIntegrations";
import { useTeams } from "../../../components/teams/useTeams";
import { flattenParam } from "../../../components/utils/flattenParam";

interface indexProps {
  user: User;
  teamId: string;
}

const TeamPage: NextPage<indexProps> = ({ user, teamId }) => {
  const teams = useTeams();

  const githubIntegration = useGithubIntegration(teamId);
  const slackIntegration = useSlackIntegrations(teamId);

  console.log(githubIntegration.error?.response?.status);

  if (teams.isLoading) {
    return <div>Loading team...</div>;
  }

  const team = teams?.data?.find((team) => team.id === teamId);

  if (!team) {
    throw Error("Couldn't find team");
  }

  const connectedToGithub = githubIntegration.data && githubIntegration.data.id;
  const connectedToSlack =
    slackIntegration.data &&
    slackIntegration.data.length > 0 &&
    slackIntegration.data[0].id;

  console.log(githubIntegration.data);

  return (
    <DashboardLayout title="Onboard" orgName={team.name ?? undefined}>
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
              <GithubButton state={teamId} />
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
              <SlackButton teamId={teamId} />
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
  async getServerSideProps({ params }) {
    const teamId = flattenParam(params?.teamId);

    console.log("Got teamId", teamId);

    return {
      props: {
        teamId,
      },
    };
  },
});
