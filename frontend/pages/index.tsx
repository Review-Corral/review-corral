import { supabaseClient } from "@supabase/auth-helpers-nextjs";
import { useUser } from "@supabase/auth-helpers-react";
import { Auth } from "@supabase/ui";
import type { NextPage } from "next";
import Link from "next/link";
import { FC } from "react";
import GithubButton from "../components/GithubButton";
import { DashboardLayout } from "../components/layout/DashboardLayout";

const Content: FC = () => {
  const { isLoading, user, error } = useUser();
  const teamId = "7611d060-35ee-401f-8e99-58b2f7a9849d";

  if (!user)
    return (
      <>
        {error && <p>{error.message}</p>}
        {isLoading ? <h1>Loading...</h1> : <h1>Loaded!</h1>}
        <button
          onClick={() => {
            supabaseClient.auth.signIn(
              { provider: "github" },
              { scopes: "repo" },
            );
          }}
        >
          GitHub with scopes
        </button>
        <Auth
          // view="update_password"
          supabaseClient={supabaseClient}
          providers={["github"]}
          // scopes={{github: 'repo'}} // TODO: enable scopes in Auth component.
          socialLayout="horizontal"
          socialButtonSize="xlarge"
        />
      </>
    );

  return (
    <>
      <p>
        [<Link href="/profile">withPageAuth</Link>] | [
        <Link href="/protected-page">supabaseServerClient</Link>] |{" "}
        <button
          onClick={() =>
            supabaseClient.auth.update({ data: { test5: "updated" } })
          }
        >
          Update
        </button>
      </p>
      {isLoading ? <h1>Loading...</h1> : <h1>Loaded!</h1>}
      <p>user:</p>
      <div className="bg-blue-500 h-20 w-20">
        Github button
        <GithubButton state={teamId} />
      </div>
      <pre>{JSON.stringify(user, null, 2)}</pre>
      <p>client-side data fetching with RLS</p>
    </>
  );
};

const Home: NextPage = () => {
  return (
    <DashboardLayout>
      <Content />
    </DashboardLayout>
  );
};

export default Home;
