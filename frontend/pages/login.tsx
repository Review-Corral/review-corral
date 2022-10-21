import {
  useSessionContext,
  useSupabaseClient,
} from "@supabase/auth-helpers-react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Github } from "../components/assets/icons/Github";
import Button from "../components/buttons/Button";

type FormData = {
  email: string;
};

const Auth: NextPage = () => {
  const router = useRouter();

  const { isLoading, session, error } = useSessionContext();
  const supabaseClient = useSupabaseClient();

  const [loginError, setLoginError] = useState<string | undefined>(undefined);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [emailSent, setEmailSent] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  console.log("user is loading: ", isLoading);
  console.log("user is: ", session?.user);

  useEffect(() => {
    if (session?.user) {
      router.push("/");
    }
  }, [session?.user]);

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          className="mx-auto h-12 w-auto"
          src="https://tailwindui.com/img/logos/workflow-mark-indigo-600.svg"
          alt="Workflow"
        />
        <div className="flex justify-center mt-8">
          <Button
            isLoading={isLoading}
            color="indigo"
            leftIcon={<Github className="fill-white h-4" />}
            onClick={async () => {
              setLoginLoading(true);
              console.log("going to log in with Github");
              const result = await supabaseClient.auth.signInWithOAuth({
                provider: "github",
                options: {
                  scopes: "repo",
                  redirectTo: "http://localhost:3000",
                },
              });

              console.log("Got result: ", JSON.stringify(result.data, null, 2));

              if (result.error) {
                console.error(result.error);
                setLoginError(result.error.message);
              } else {
                router.push("/");
              }

              setLoginLoading(false);
            }}
          >
            <div className="flex items-center gap-x-2">
              Get started with Github
            </div>
          </Button>
        </div>
      </div>
      {loginError && (
        <div className="mt-6">
          <div className="relative">
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-red-500">
                Error logging in
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
