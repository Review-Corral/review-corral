import { z } from "zod";

export interface OrgViewPathParams {
  orgId: string;
}

export type OrgViewPage = (args: {
  params: OrgViewPathParams;
}) => React.ReactNode;

export const optionalOrgViewPathSchema = z.object({
  orgId: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Number(val);
    }),
});

export const orgViewPathSchema = z.object({
  orgId: z.string().transform((val) => {
    return Number(val);
  }),
});
