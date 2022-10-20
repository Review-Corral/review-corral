import { CheckCircleIcon } from "@heroicons/react/outline";
import {
  useSessionContext,
  useSupabaseClient,
} from "@supabase/auth-helpers-react";
import { Button } from "@supabase/ui";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

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
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{" "}
          <a
            href="#"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            start your 14-day free trial
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Button
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
            Github login
          </Button>

          {emailSent && <EmailSentSuccess />}

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
      </div>
    </div>
  );
};

export function EmailSentSuccess() {
  return (
    <div className="rounded-md bg-green-50 p-4 mt-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <CheckCircleIcon
            className="h-5 w-5 text-green-400"
            aria-hidden="true"
          />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-green-800">
            Magic link sent!
          </h3>
          <div className="mt-2 text-sm text-green-700">
            <p>Check your inbox for your login link</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
