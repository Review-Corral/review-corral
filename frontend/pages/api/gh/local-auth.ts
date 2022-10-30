import withApiSupabase from "../../../components/api/utils/withApiSupabase";
import { Database } from "../../../database-types";

// Utility to redirect Github OAuth requests from Ngrok to the correct URL
export default withApiSupabase<Database>(async function ProtectedRoute(
  req,
  res,
  _,
) {
  console.log(`Got request to ${req.method} /api/gh/local-auth`);
  console.log("req.query", req.query);
  const params = new URLSearchParams(
    req.query as Record<string, string>,
  ).toString();

  console.log("generated params: ", params);

  res.redirect(307, "http://localhost:54321/auth/v1/callback?" + params).end();
});
