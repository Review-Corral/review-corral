import { withPageAuth } from "@supabase/auth-helpers-nextjs";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useInstallations } from "../components/hooks/useInstallations";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { useTeams } from "../components/teams/useTeams";

const Home: NextPage = () => {
  const teams = useTeams();
  const router = useRouter();

  const installations = useInstallations();

  useEffect(() => {
    if (teams.data && teams.data.length > 0) {
      router.push(`/teams/${teams.data[0].id}`);
    }
  }, [teams]);

  if (teams.isLoading) {
    return <div>Loading Teams...</div>;
  }

  // return <div>Hello</div>;

  return <DashboardLayout title="Onboarding">hello</DashboardLayout>;
};

export default Home;

export const getServerSideProps = withPageAuth({
  authRequired: true,
  redirectTo: "/login",
});
