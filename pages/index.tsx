import type { NextPage } from "next";
import HomeView from "../components/home/HomeView";
import { withPageAuth } from "../components/utils/withPageAuth";

const Home: NextPage = () => {
  return <HomeView />;
};

export default Home;

export const getServerSideProps = withPageAuth({});
