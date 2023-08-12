import {
  useSessionContext,
  useSupabaseClient,
} from "@supabase/auth-helpers-react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import LoadingView from "../components/views/LoadingView";

interface SignoutPageProps {}

const SignoutPage: NextPage<SignoutPageProps> = () => {
  const router = useRouter();
  const { isLoading, session, error } = useSessionContext();
  const supabaseClient = useSupabaseClient();

  useEffect(() => {
    supabaseClient.auth
      .signOut()
      .then(() => router.push("/login"))
      .catch((error) => {
        console.error("Error signing out", error);
      });
  }, []);

  return <LoadingView />;
};

export default SignoutPage;
