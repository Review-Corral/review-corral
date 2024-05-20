import { Subscription } from "../dynamodb/entities/types";

export interface BillingDetailsResponse {
  subscriptions: Subscription[];
}
