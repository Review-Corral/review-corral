import { z } from "zod";

export const createCheckoutSessionBodySchema = z.object({
  orgId: z.number(),
  priceId: z
    .literal("price_1P9FpDBqa9UplzHeeJ57VHoc") // test price
    .or(z.literal("price_1P8CmKBqa9UplzHebShipTnE")), // prod price,
});

export type CreateCheckoutSessionBody = z.infer<typeof createCheckoutSessionBodySchema>;

export const stripeCheckoutCreatedMetadataSchema = z.object({
  userId: z
    .string()
    .optional()
    .transform((v) => v ?? Number(v)),
  orgId: z.string().transform(Number),
});

export type StripeCheckoutCreatedMetadata = z.infer<
  typeof stripeCheckoutCreatedMetadataSchema
>;
