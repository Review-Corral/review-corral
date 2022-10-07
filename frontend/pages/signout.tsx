import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import LoadingView from "../components/views/LoadingView";

interface SignoutPageProps {}

const SignoutPage: NextPage<SignoutPageProps> = () => {
  const router = useRouter();

  useEffect(() => {
    router.push("/api/auth/logout");
  }, []);

  return <LoadingView />;
};

export default SignoutPage;
