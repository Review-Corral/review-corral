import { withPageAuth } from "@supabase/auth-helpers-nextjs";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import GithubButton from "../components/GithubButton";
import { useTeams } from "../components/hooks/useTeams";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import SlackButton from "../components/SlackButton";

const teamId = "7611d060-35ee-401f-8e99-58b2f7a9849d";

const Home: NextPage = () => {
  const router = useRouter();
  const teams = useTeams();
  return (
    <DashboardLayout>
      <h1>Welcome to Review Corral!</h1>
      <div className="space-y-6">
        <GithubButton state={""} />
        <SlackButton />
      </div>
    </DashboardLayout>
  );
};

export default Home;

withPageAuth();
