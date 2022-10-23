import { withPageAuth } from "@supabase/auth-helpers-nextjs";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import HomeView from "../components/home/HomeView";
import { useInstallations } from "../components/hooks/useInstallations";

const Home: NextPage = () => {
  const router = useRouter();

  const installations = useInstallations();

  // return <div>Hello</div>;

  return <HomeView />;
};

export default Home;

export const getServerSideProps = withPageAuth({
  authRequired: true,
  redirectTo: "/login",
});
