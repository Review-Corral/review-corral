// pages/api/protected-route.js
import { withApiAuth } from "@supabase/auth-helpers-nextjs";
import axios from "axios";
import { Database } from "../../../dabatabase-types";
import { InstallationsResponse } from "../../../github-types";

export default withApiAuth<Database>(async function ProtectedRoute(
  req,
  res,
  supabaseServerClient,
) {
  const { data } = await supabaseServerClient.auth.getSession();

  const result = await supabaseServerClient
    .from("users")
    .select("*")
    .eq("id", data?.session?.user?.id);

  // Run queries with RLS on the server

  const reponse = await axios.get<InstallationsResponse>(
    "https://api.github.com/user/installations",
    {
      headers: {
        Authorization: `token ${result?.data?.[0].gh_access_token}`,
      },
    },
  );

  res.json(reponse.data);
});
