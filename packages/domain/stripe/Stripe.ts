import { assertVarExists } from "@core/utils/assert";
import Stripe from "stripe";

export const StripeClient = new Stripe(assertVarExists("STRIPE_SECRET_KEY"), {
  apiVersion: "2024-04-10",
});
