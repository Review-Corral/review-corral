import { useInstallations } from "../hooks/useInstallations";
import { DashboardLayout } from "../layout/DashboardLayout";
import { withInstallations } from "../views/withInstallations";

const HomeView = () => {
  const { data, isLoading } = useInstallations();

  console.log("Got data: ", data);
  return (
    <DashboardLayout title="Home">
      {data?.installations.map((installation) => (
        <a href={`/org/${installation.id}`}>
          <div key={installation.id}>{installation.id}</div>
        </a>
      ))}
    </DashboardLayout>
  );
};

export default withInstallations(HomeView);
