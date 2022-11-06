import { withAxiom } from "next-axiom";
import { withProtectedApi } from "../../../../components/api/utils/withProtectedApi";
import { flattenParam } from "../../../../components/utils/flattenParam";

export default withAxiom(
  withProtectedApi(async function ProtectedRoute(
    req,
    res,
    supabaseServerClient,
  ) {
    const orgId = flattenParam(req.query?.["orgId"]);

    if (orgId === null) {
      return res.status(400).send({ error: "Missing organization Id" });
    }

    req.log.info(
      "Got request for Slack integrations for organization ID: ",
      orgId,
    );

    const { data, error } = await supabaseServerClient
      .from("slack_integration")
      .select("*")
      .eq("organization_id", orgId);

    if (error) {
      req.log.error("Error getting Slack integrations: ", error);
      return res.status(500).send({ error: "Error getting Slack integration" });
    }

    return res.status(200).send({ data });
  }),
);
