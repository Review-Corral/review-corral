import { NextApiResponse } from "next";
import { AxiomAPIRequest, withAxiom } from "next-axiom/dist/withAxiom";

const handler = (req: AxiomAPIRequest, res: NextApiResponse) => {
  req.log.info("Called Status API check");
  res.status(200).send({ data: "OK" });
};

export default withAxiom(handler);
