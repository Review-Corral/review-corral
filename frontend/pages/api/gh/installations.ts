// pages/api/protected-route.js
import { withApiAuth } from "@supabase/auth-helpers-nextjs";
import axios from "axios";
import { Database } from "../../../dabatabase-types";
import { Installations } from "../../../github-types";

export default withApiAuth<Database>(async function ProtectedRoute(
  req,
  res,
  supabaseServerClient,
) {
  const { data } = await supabaseServerClient.auth.getSession();
  // Run queries with RLS on the server

  const reponse = await axios.get<Installations[]>(
    "https://api.github.com/user/installations",
    {
      headers: {
        Authorization: `token ${data.session?.provider_token}`,
      },
    },
  );

  res.json(reponse.data);
});
