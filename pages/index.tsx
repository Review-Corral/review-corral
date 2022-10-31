import { withPageAuth } from "@supabase/auth-helpers-nextjs";
import type { NextPage } from "next";
import HomeView from "../components/home/HomeView";

const Home: NextPage = () => {
  return <HomeView />;
};

export default Home;

export const getServerSideProps = withPageAuth({
  authRequired: true,
  redirectTo: "/login",
});
