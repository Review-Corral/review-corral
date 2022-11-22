import { User } from "@supabase/supabase-js";
import type { NextPage } from "next";
import HomeView from "../components/home/HomeView";
import { withPageAuth } from "../components/utils/withPageAuth";

const Home: NextPage<{ user: User }> = () => {
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

export const getServerSideProps = withPageAuth({
  authRequired: true,
  getServerSideProps: async (context, supabase) => {
    const user = await supabase.auth.getUser();

    if (user.data.user) {
      return {
        props: { user: user.data.user },
      };
    }

    return {
      notFound: true,
    };
  },
});
