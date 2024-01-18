import { DashboardTabs } from "./tabs";
import { OrgViewPathParams, orgViewPathSchema } from "./types";

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: OrgViewPathParams;
}) {
  const { orgId } = orgViewPathSchema.parse(params);
  return (
    <div>
      <div>
        <DashboardTabs orgId={orgId} />
      </div>
      <div className="max-w-7xl mx-auto py-6 px-7">{children}</div>
    </div>
  );
}
