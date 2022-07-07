import { withPageAuth } from "@supabase/auth-helpers-nextjs";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { DashboardLayout } from "../components/layout/DashboardLayout";

const teamId = "7611d060-35ee-401f-8e99-58b2f7a9849d";

const Home: NextPage = () => {
  const router = useRouter();
  return (
    <DashboardLayout>
      <h1>Welcome to Review Corral!</h1>
      <button onClick={() => router.push("/login")}>Login</button>
    </DashboardLayout>
  );
};

export default Home;

withPageAuth();
