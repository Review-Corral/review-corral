import { User, withPageAuth } from "@supabase/auth-helpers-nextjs";
import { NextPage } from "next";
import { Github } from "../../../components/assets/icons/Github";
import { Slack } from "../../../components/assets/icons/Slack";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { InstalledRepos } from "../../../components/teams/repos/InstalledRepos";
import { SlackIntegrations } from "../../../components/teams/slack/SlackIntegrations";
import { UsernameMappings } from "../../../components/teams/slack/username-mappings/UsernameMappings";
import { useTeams } from "../../../components/teams/useTeams";
import { flattenParam } from "../../../components/utils/flattenParam";

interface indexProps {
  user: User;
  teamId: string;
}

const TeamPage: NextPage<indexProps> = ({ user, teamId }) => {
  const teams = useTeams();

  if (teams.isLoading) {
    return <div>Loading team...</div>;
  }

  const team = teams?.data?.find((team) => team.id === teamId);

  if (!team) {
    throw Error("Couldn't find team");
  }

  return (
    <DashboardLayout title="Dashboard" orgName={team.name ?? undefined}>
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
            <div className="flex p-4 bg-gray-100 rounded-md justify-between">
              <Slack className="h-8 w-8 fill-black" />
              <span className="font-semibold text-lg">Slack Integration</span>
            </div>
            <div className="px-4 py-6">
              <SlackIntegrations teamId={teamId} />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <UsernameMappings teamId={teamId} />
      </div>
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
