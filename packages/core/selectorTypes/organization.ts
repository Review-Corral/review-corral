export interface Subscription {
  id: string;
  orgId: number;
  customerId: string;
  subscriptionId: string;
  priceId: string | null;
  status: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingDetailsResponse {
  subscriptions: Subscription[];
}
