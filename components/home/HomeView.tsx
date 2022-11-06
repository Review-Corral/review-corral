import Image from "next/image";
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
      <div className="inline-flex flex-col gap-2">
        {data?.installations.map((installation) => (
          <Link key={installation.id} href={`/org/${installation.account.id}`}>
            <div className="inline-flex items-center space-x-2 cursor-pointer">
              <div className="rounded-md overflow-hidden">
                <Image
                  alt={"Avatar url"}
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
