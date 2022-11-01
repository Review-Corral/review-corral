import { ApiResponse } from "../../../components/api/utils/apiBaseTypes";
import { getJwt } from "../../../components/api/utils/apiUtils";
import withApiSupabase from "../../../components/api/utils/withApiSupabase";

export default withApiSupabase<ApiResponse<any>>(async function ProtectedRoute(
  req,
  res,
  supabaseServerClient,
) {
  const jwt = await getJwt();
  res.status(200).json({ data: jwt.toString() });
});
