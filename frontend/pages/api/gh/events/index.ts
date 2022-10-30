import { NextApiRequest, NextApiResponse } from "next";
import withApiSupabase from "../../../../components/api/utils/withApiSupabase";

export default withApiSupabase(async function GithubEvents(
  req: NextApiRequest,
  res: NextApiResponse,
  supabaseClient,
) {
  console.info("Got event: ", req.body);

  // const { data, error } = await supabaseClient.from("users").select("*");

  return res.status(200).end();
});
