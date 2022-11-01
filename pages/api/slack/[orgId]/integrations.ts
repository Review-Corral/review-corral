import { withApiAuth } from "@supabase/auth-helpers-nextjs";
import { flattenParam } from "../../../../components/utils/flattenParam";
import { Database } from "../../../../database-types";

export default withApiAuth<Database>(async function ProtectedRoute(
  req,
  res,
  supabaseServerClient,
) {
  const orgId = flattenParam(req.query?.["orgId"]);

  if (orgId === null) {
    return res.status(400).send({ error: "Missing organization Id" });
  }

  console.info(
    "Got request for Slack integrations for organization ID: ",
    orgId,
  );

  const { data, error } = await supabaseServerClient
    .from("slack_integration")
    .select("*")
    .eq("organization_id", orgId);

  if (error) {
    console.error("Error getting Slack integrations: ", error);
    return res.status(500).send({ error: error.message });
  }

  return res.status(200).send({ data });
});
