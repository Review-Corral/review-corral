import { User, withPageAuth } from "@supabase/auth-helpers-nextjs";
import { NextPage } from "next";
import GithubButton from "../../../components/GithubButton";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import SlackButton from "../../../components/SlackButton";
import { InstalledRepos } from "../../../components/teams/repos/InstalledRepos";
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
    <DashboardLayout teamName={team.name ?? undefined}>
      <div className="space-y-6 flex flex-col">
        <GithubButton state={team.id} />
        <SlackButton teamId={team.id} />

        <InstalledRepos teamId={teamId} />
      </div>
    </DashboardLayout>
  );
};

export default TeamPage;

export const getServerSideProps = withPageAuth({
  redirectTo: "/login",
  async getServerSideProps({ params }) {
    // Run queries with RLS on the server
    const teamId = flattenParam(params?.teamId);

    console.log("Got teamID", teamId);

    return {
      props: {
        teamId,
      },
    };
  },
});
