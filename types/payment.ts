export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

export type PaymentType =
  | "registration"
  | "subscription"
  | "featured"
  | "boost"
  | "contact_unlock"
  | "verification";

export interface Payment {
  id: string;

  userId: string;

  paymentType: PaymentType;

  amount: number;

  gstAmount: number;

  totalAmount: number;

  currency: "INR";

  status: PaymentStatus;

  paymentGateway: "razorpay";

  orderId?: string;

  paymentId?: string;

  signature?: string;

  invoiceNumber?: string;

  paidAt?: string;

  createdAt: string;

  updatedAt: string;
}