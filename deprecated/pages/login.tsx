import {
  useSessionContext,
  useSupabaseClient,
} from "@supabase/auth-helpers-react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Github } from "../../components/assets/icons/Github";
import Button from "../../components/buttons/Button";
import { Database } from "../types/database-types";

const Auth: NextPage = () => {
  const router = useRouter();

  const { isLoading, session } = useSessionContext();
  const supabaseClient = useSupabaseClient<Database>();

  const [loginError, setLoginError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (session?.user) {
      // Store the provider token and refresh token (if exist) since these
      // will not persist in the session permanently.
      supabaseClient
        .from("users")
        .update({
          gh_access_token: session.provider_token,
          gh_refresh_token: session.refresh_token,
        })
        .eq("id", session.user.id)
        .then(() => {
          router.push("/");
        });
    }
  }, [session?.user]);

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          className="mx-auto h-12 w-auto"
          src="https://avatars.githubusercontent.com/in/203068?s=120&u=4f27b80d54a1405e10756a1dc0175d1ef3866422&v=4"
          alt="Review Corral logo"
        />
        <div className="text-center text-2xl mt-4">Review Corral</div>
        <div className="flex justify-center mt-8">
          <Button
            isLoading={isLoading}
            color="indigo"
            leftIcon={<Github className="fill-white h-4" />}
            onClick={async () => {
              const result = await supabaseClient.auth.signInWithOAuth({
                provider: "github",
                options: {
                  scopes: "repo",
                  redirectTo: "http://localhost:3000",
                },
              });

              if (result.error) {
                console.error(result.error);
                setLoginError(result.error.message);
              } else {
                router.push("/");
              }
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
