import { withApiAuth } from "@supabase/auth-helpers-nextjs";
import {
  getInstallationAccessToken,
  isValidBody,
} from "../../../../components/utils/apiUtils";
import { Database } from "../../../../database-types";

type GetRepositoriesRequest = {
  installationId: number;
};

export default withApiAuth<Database>(async function ProtectedRoute(
  req,
  res,
  supabaseServerClient,
) {
  const { data } = await supabaseServerClient.auth.getSession();

  if (req.method === "GET") {
    if (!isValidBody<GetRepositoriesRequest>(req.body, ["installationId"])) {
      return res.status(402).json({ error: "Invalid body" });
    }

    await getInstallationAccessToken(req.body.installationId);

    const { data, error } = await supabaseServerClient
      .from("github_repositories")
      .select("*")
      .eq("installation_id", req.body.installationId);

    return res.status(200).json(data);
  }
});
