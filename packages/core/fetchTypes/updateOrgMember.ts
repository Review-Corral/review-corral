import { z } from "zod";

export const updateMemberSchema = z.object({
  memberId: z.number(),
  orgId: z.number(),
  slackId: z.string().nullable(),
});

export type UpdateMemberArgs = z.infer<typeof updateMemberSchema>;
