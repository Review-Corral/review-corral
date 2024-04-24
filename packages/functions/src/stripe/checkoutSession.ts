import { ApiHandler } from "sst/node/api";
import z from "zod";

const bodySchema = z.object({
  orgId: z.number(),
});

export const handler = ApiHandler(async (event, context) => {});
