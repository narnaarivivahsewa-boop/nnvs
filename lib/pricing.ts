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

/**
 * Welcome Launch Offer cutoff:
 * Active through 31st December 2026 23:59:59.999 IST (+05:30).
 * Reverts automatically to regular fees from 1st January 2027 00:00:00.000 IST onward.
 */
export const OFFER_END_DATE_IST = new Date("2026-12-31T23:59:59.999+05:30");

export const REGULAR_REGISTRATION_FEES = {
  MALE: 799,
  FEMALE: 399,
} as const;

export const OFFER_REGISTRATION_FEES = {
  MALE: 99,
  FEMALE: 99,
} as const;

export const REGISTRATION_GST_RATE = 18;
export const OFFER_VALIDITY_LABEL = "Valid till 31st Dec 2026";
export const OFFER_ANNOUNCEMENT_TEXT =
  "🎉 Limited Time Welcome Offer: Verified Matrimony Registration at just ₹99 + GST for all Brides & Grooms (Valid till 31st Dec 2026)!";

export type NormalizedGender = "MALE" | "FEMALE";

export function normalizePricingGender(gender?: string | null): NormalizedGender {
  const normalized = String(gender || "").trim().toUpperCase();
  if (normalized === "FEMALE" || normalized === "BRIDE" || normalized === "GIRL") {
    return "FEMALE";
  }
  return "MALE";
}

export function isLaunchOfferActive(now: Date = new Date()): boolean {
  return now.getTime() <= OFFER_END_DATE_IST.getTime();
}

export function getRegistrationFee(
  gender: "MALE" | "FEMALE",
  now: Date = new Date()
): number {
  const normalized = normalizePricingGender(gender);
  if (isLaunchOfferActive(now)) {
    return OFFER_REGISTRATION_FEES[normalized];
  }
  return REGULAR_REGISTRATION_FEES[normalized];
}

export function getRegularRegistrationFee(
  gender: "MALE" | "FEMALE" | string | null | undefined
): number {
  const normalized = normalizePricingGender(gender);
  return REGULAR_REGISTRATION_FEES[normalized];
}

export interface RegistrationPricingDetails {
  gender: NormalizedGender;
  isOfferActive: boolean;
  baseFee: number;
  regularBaseFee: number;
  gstRate: number;
  gstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number;
  regularGstAmount: number;
  regularTotalAmount: number;
  savingsBaseAmount: number;
  savingsTotalAmount: number;
  validityLabel: string;
}

export function getRegistrationPricingDetails(
  gender: "MALE" | "FEMALE" | string | null | undefined,
  now: Date = new Date()
): RegistrationPricingDetails {
  const normalized = normalizePricingGender(gender);
  const offerActive = isLaunchOfferActive(now);
  const regularBaseFee = REGULAR_REGISTRATION_FEES[normalized];
  const baseFee = getRegistrationFee(normalized, now);

  const gstAmount = calculateGST(baseFee, REGISTRATION_GST_RATE);
  const cgstAmount = Number((gstAmount / 2).toFixed(2));
  const sgstAmount = Number((gstAmount - cgstAmount).toFixed(2));
  const totalAmount = Number((baseFee + gstAmount).toFixed(2));

  const regularGstAmount = calculateGST(regularBaseFee, REGISTRATION_GST_RATE);
  const regularTotalAmount = Number((regularBaseFee + regularGstAmount).toFixed(2));

  return {
    gender: normalized,
    isOfferActive: offerActive,
    baseFee,
    regularBaseFee,
    gstRate: REGISTRATION_GST_RATE,
    gstAmount,
    cgstAmount,
    sgstAmount,
    totalAmount,
    regularGstAmount,
    regularTotalAmount,
    savingsBaseAmount: Number((regularBaseFee - baseFee).toFixed(2)),
    savingsTotalAmount: Number((regularTotalAmount - totalAmount).toFixed(2)),
    validityLabel: OFFER_VALIDITY_LABEL,
  };
}

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
