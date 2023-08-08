import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { AxiomAPIRequest, withAxiom } from "next-axiom";
import { cookies } from "next/headers";
import { useSearchParams } from "next/navigation";
import { NextResponse } from "next/server";
import { Database } from "types/database-types";
import { flattenParam } from "../../../../../components/utils/flattenParam";

export const GET = withAxiom(async (req: AxiomAPIRequest) => {
  const supabaseServerClient = createRouteHandlerClient<Database>({ cookies });
  const searchParams = useSearchParams();
  const orgId = flattenParam(searchParams?.get("orgId"));

  if (orgId === null) {
    return NextResponse.json({ error: "No orgId provided" }, { status: 404 });
  }

  req.log.info("Got request for Slack integrations for organization ID: ", {
    orgId,
  });

  const { data, error } = await supabaseServerClient
    .from("slack_integration")
    .select("*")
    .eq("organization_id", orgId);

  if (error) {
    req.log.error("Error getting Slack integrations: ", error);
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 200 });
});
