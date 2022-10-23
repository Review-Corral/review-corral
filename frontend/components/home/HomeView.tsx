import { DashboardLayout } from "../layout/DashboardLayout";
import { withInstallations } from "../views/withInstallations";

const HomeView = () => {
  return <DashboardLayout title="Home">hello</DashboardLayout>;
};

export default withInstallations(HomeView);
