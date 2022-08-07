import { withPageAuth } from "@supabase/auth-helpers-nextjs";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import GithubButton from "../components/GithubButton";
import { useTeams } from "../components/hooks/useTeams";
import { DashboardLayout } from "../components/layout/DashboardLayout";

const teamId = "7611d060-35ee-401f-8e99-58b2f7a9849d";

const Home: NextPage = () => {
  const router = useRouter();
  const teams = useTeams();

  if (teams.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1>Welcome to Review Corral!</h1>
        {!teams.data || teams.data.length < 1 ? (
          <div>No team!</div>
        ) : (
          <div className="space-y-6">
            <GithubButton state={teams.data[0].id} />
            {/* <SlackButton /> */}
          </div>
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
