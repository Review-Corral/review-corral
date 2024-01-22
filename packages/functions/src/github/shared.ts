import * as z from "zod";

export const organizationParamSchema = z.object({
  organizationId: z.string(),
});
