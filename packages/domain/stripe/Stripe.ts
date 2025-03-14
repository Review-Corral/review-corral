import { Resource } from "sst";
import { Stripe } from "stripe";

export const StripeClient = new Stripe(Resource.STRIPE_SECRET_KEY.value, {
  apiVersion: "2025-02-24.acacia",
});
