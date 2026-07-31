import { PricingSettings } from "@/types/admin";

export const DEFAULT_PRICING: PricingSettings = {
  maleRegistrationFee: 799,

  femaleRegistrationFee: 399,

  gstPercentage: 18,

  featuredProfileFee: 299,

  profileBoostFee: 199,

  contactUnlockFee: 99,

  idVerificationFee: 199,

  backgroundVerificationFee: 499,
};

export function calculateGST(amount: number, gst: number) {
  return Number(((amount * gst) / 100).toFixed(2));
}

export function calculateTotal(amount: number, gst: number) {
  const gstAmount = calculateGST(amount, gst);

  return {
    amount,
    gstAmount,
    total: Number((amount + gstAmount).toFixed(2)),
  };
}