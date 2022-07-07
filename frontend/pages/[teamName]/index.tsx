import { User, withPageAuth } from "@supabase/auth-helpers-nextjs";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { DashboardLayout } from "../../components/layout/DashboardLayout";

interface indexProps {
  user: User;
}

const TeamPage: NextPage<indexProps> = ({ user }) => {
  const router = useRouter();
  return (
    <DashboardLayout>
      <div className="space-y-6 flex flex-col">
        <span>On protected page</span>
        <span>{user.id}</span>
        <button
          className="inline-block"
          onClick={() => router.push("/api/auth/logout")}
        >
          Logout
        </button>
      </div>
    </DashboardLayout>
  );
};

export default TeamPage;

export const getServerSideProps = withPageAuth({
  redirectTo: "/login",
});
