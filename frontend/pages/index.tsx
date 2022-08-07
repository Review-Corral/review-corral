import { withPageAuth } from "@supabase/auth-helpers-nextjs";
import type { NextPage } from "next";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { CreateTeamForm } from "../components/teams/CreateTeamForm";
import { TeamsView } from "../components/teams/TeamsView";
import { useTeams } from "../components/teams/useTeams";

const Home: NextPage = () => {
  const teams = useTeams();

  if (teams.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1>Welcome to Review Corral!</h1>
        {!teams.data || teams.data.length < 1 ? (
          <CreateTeamForm />
        ) : (
          <TeamsView teams={teams.data} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Home;

export const getServerSideProps = withPageAuth({
  authRequired: true,
  redirectTo: "/login",
});
