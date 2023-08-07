"use client";

import HomeView from "@/components/home/HomeView";
import { User } from "@supabase/supabase-js";
import { NextPage } from "next";

const Home: NextPage<{ user: User; syncGithub?: boolean }> = () => {
  return <HomeView />;
};

export default Home;
