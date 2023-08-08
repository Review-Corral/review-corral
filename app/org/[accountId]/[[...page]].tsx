import { Pages } from "@/components/organization/shared";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Database } from "types/database-types";
import OrgOverviewPage from "./org-overview";

export default async function OrgOverview({
  params: { accountId, page },
}: {
  params: { accountId: string; page: string };
}) {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  if (!accountId) {
    return {
      notFound: true,
      props: {},
    };
  }

  const { data: organization, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("account_id", accountId)
    .limit(1)
    .single();

  if (error) {
    console.error(
      "Got error getting organization by account ID ",
      accountId,
      ": ",
      error,
    );
    return {
      notFound: true,
      props: {},
    };
  }

  return <OrgOverviewPage organization={organization} page={page as Pages} />;
}
