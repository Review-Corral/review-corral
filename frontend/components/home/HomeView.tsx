import Link from "next/link";
import { useInstallations } from "../hooks/useInstallations";
import { DashboardLayout } from "../layout/DashboardLayout";
import { withInstallations } from "../views/withInstallations";

const HomeView = () => {
  const { data, isLoading } = useInstallations();

  // TODO: should load organizations here instead

  console.log("Got data: ", data);
  return (
    <DashboardLayout title="Home">
      <div className="flex flex-col gap-2">
        {data?.installations.map((installation) => (
          <Link key={installation.id} href={`/org/${installation.account.id}`}>
            <div className="flex items-center space-x-2">
              <div className="rounded-md overflow-hidden">
                <img
                  src={installation.account.avatar_url}
                  width={32}
                  height={32}
                />
              </div>
              <div>{installation.account.login}</div>
            </div>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default withInstallations(HomeView);
