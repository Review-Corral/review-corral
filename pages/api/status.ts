import { SupabaseClient } from "@supabase/supabase-js";
import { NextApiResponse } from "next";
import { AxiomAPIRequest, withAxiom } from "next-axiom/dist/withAxiom";
import withApiSupabase from "../../services/utils/withApiSupabase";

const handler = async (
  req: AxiomAPIRequest,
  res: NextApiResponse,
  supabase: SupabaseClient,
): Promise<void | undefined> => {
  req.log.info("Called Status API check");
  res.status(200).send({ data: "OK" });
};

export default withAxiom(withApiSupabase(handler));
