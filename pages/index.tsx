import { User } from "@supabase/supabase-js";
import type { NextPage } from "next";
import HomeView from "../components/home/HomeView";
import { flattenParam } from "../components/utils/flattenParam";
import { withPageAuth } from "../components/utils/withPageAuth";

const Home: NextPage<{ user: User; syncGithub?: boolean }> = () => {
  return <HomeView />;
};

export default Home;

export const getServerSideProps = withPageAuth({
  authRequired: true,
  getServerSideProps: async (_context, supabase) => {
    const user = await supabase.auth.getUser();
    const syncGithub = flattenParam(_context.query?.["sync_github"]);

    if (user.data.user) {
      return {
        props: { user: user.data.user, syncGithub },
      };
    }

    return {
      notFound: true,
    };
  },
});
