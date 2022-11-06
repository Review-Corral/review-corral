import type { NextPage } from "next";
import HomeView from "../components/home/HomeView";
import { withPageAuth } from "../components/utils/withPageAuth";

const Home: NextPage = () => {
  return <HomeView />;
};

export default Home;

// export async function getServerSideProps(context) {
//   const func = await withPageAuth({
//     getServerSideProps: async (context, supabase) => {
//       return {
//         props: {},
//       };
//     },
//   });

//   return await func(context);
// }

export const getServerSideProps = withPageAuth({});
