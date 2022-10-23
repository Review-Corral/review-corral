import { withPageAuth } from "@supabase/auth-helpers-nextjs";
import type { NextPage } from "next";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Database } from "../../dabatabase-types";

export const OrgView: NextPage<{ orgId: string }> = ({ orgId }) => {
  return <DashboardLayout title={"Org View"}>{orgId}</DashboardLayout>;
};

export default OrgView;

export const getServerSideProps = withPageAuth<Database, "public">({
  redirectTo: "/login",
  async getServerSideProps(ctx, _) {
    const orgId = ctx.params?.["orgId"];

    return { props: { orgId } };
  },
});
