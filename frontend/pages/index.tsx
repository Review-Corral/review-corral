import { withPageAuth } from "@supabase/auth-helpers-nextjs";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { CreateTeamForm } from "../components/teams/CreateTeamForm";
import { useTeams } from "../components/teams/useTeams";

const Home: NextPage = () => {
  const teams = useTeams();
  const router = useRouter();

  useEffect(() => {
    if (teams.data && teams.data.length > 0) {
      router.push(`/teams/${teams.data[0].id}`);
    }
  }, [teams]);

  if (teams.isLoading) {
    return <div>Loading Teams...</div>;
  }

  // return <div>Hello</div>;

  return (
    <DashboardLayout title="Onboarding">
      <div className="space-y-6">
        <h1>Welcome to Review Corral!</h1>
        {!teams.data || teams.data.length < 1 ? (
          <CreateTeamForm />
        ) : (
          <div>Loading Teams...</div>
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
