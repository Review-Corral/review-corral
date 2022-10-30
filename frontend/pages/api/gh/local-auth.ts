import { withApiAuth } from "@supabase/auth-helpers-nextjs";
import { Database } from "../../../database-types";

// Utility to redirect Github OAuth requests from Ngrok to the correct URL
export default withApiAuth<Database>(async function ProtectedRoute(
  req,
  res,
  _,
) {
  res.redirect(307, "http://localhost:54321/auth/v1/callback");
});
