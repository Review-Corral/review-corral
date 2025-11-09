export interface Subscription {
  id: string;
  orgId: number;
  customerId: string;
  subscriptionId: string;
  priceId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingDetailsResponse {
  subscriptions: Subscription[];
}
