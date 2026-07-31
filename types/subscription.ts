export type SubscriptionPlan =
  | "free"
  | "premium"
  | "premium_plus";

export type SubscriptionStatus =
  | "active"
  | "expired"
  | "cancelled"
  | "pending";

export interface Subscription {
  id: string;

  userId: string;

  plan: SubscriptionPlan;

  status: SubscriptionStatus;

  startDate: string;

  endDate: string;

  autoRenew: boolean;

  amountPaid: number;

  paymentId?: string;

  createdAt: string;

  updatedAt: string;
}   