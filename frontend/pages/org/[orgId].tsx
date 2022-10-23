import { withPageAuth } from "@supabase/auth-helpers-nextjs";
import type { NextPage } from "next";
import { DashboardLayout } from "../../components/layout/DashboardLayout";

export const OrgView: NextPage<{ orgId: string }> = ({ orgId }) => {
  return <DashboardLayout title={"Org View"}>{orgId}</DashboardLayout>;
};

export default OrgView;

export const getServerSideProps = withPageAuth({
  redirectTo: "/login",
  async getServerSideProps(ctx, supabase) {
    const { orgId } = ctx.params;
    console.log("params: ", ctx.params);
    console.log("orgId: ", orgId);
    return { props: { orgId } };
  },
});
