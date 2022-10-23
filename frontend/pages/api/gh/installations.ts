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
  const providerToken = req.cookies["supabase_auth_token"];

  const { data } = await supabaseServerClient.auth.getSession();
  // Run queries with RLS on the server

  console.log("Got session: ", JSON.stringify(data, null, 2));
  console.log("Got provider token: ", data.session?.provider_token);

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
