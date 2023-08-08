import { Github } from "@/components/assets/icons/Github";
import Button from "@/components/buttons/Button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { NextPage } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Database } from "types/database-types";

const LoginView: NextPage = () => {
  const router = useRouter();

  const supabase = createClientComponentClient<Database>();

  const [isLoading, setIsLoading] = useState(false);

  const [loginError, setLoginError] = useState<string | undefined>(undefined);

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
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
              setIsLoading(true);
              const result = await supabase.auth.signInWithOAuth({
                provider: "github",
                options: {
                  scopes: "repo",
                  redirectTo: "http://localhost:3000",
                },
              });

              if (result.error) {
                setIsLoading(false);
                console.error(result.error);
                setLoginError(result.error.message);
              } else {
                setIsLoading(false);
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

export default LoginView;
