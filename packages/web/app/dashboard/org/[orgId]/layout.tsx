import { DashboardTabs } from "./tabs";
import { OrgViewPathParams } from "./types";

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: OrgViewPathParams;
}) {
  return (
    <div>
      <div>
        <h1>Dashboard Layout</h1>

        <div>Org ID: {params.orgId}</div>
        <DashboardTabs />
      </div>
      <div>{children}</div>
    </div>
  );
}
