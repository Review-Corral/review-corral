import { NextApiRequest, NextApiResponse } from "next";
import withApiSupabase from "../../../../components/api/utils/withApiSupabase";

export default withApiSupabase(async function GithubEvents(
  req: NextApiRequest,
  res: NextApiResponse,
  supabaseClient,
) {
  const { data, error } = await supabaseClient.from("users").select("*");

  return res.status(200).send({ data });
});
