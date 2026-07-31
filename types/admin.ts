export interface PricingSettings {
  maleRegistrationFee: number;

  femaleRegistrationFee: number;

  gstPercentage: number;

  featuredProfileFee: number;

  profileBoostFee: number;

  contactUnlockFee: number;

  idVerificationFee: number;

  backgroundVerificationFee: number;
}

export interface MembershipPlan {
  id: string;

  name: string;

  durationInDays: number;

  price: number;

  active: boolean;
}

export interface Coupon {
  id: string;

  code: string;

  discountType: "flat" | "percentage";

  discountValue: number;

  maxDiscount?: number;

  minOrderValue?: number;

  validFrom: string;

  validTill: string;

  active: boolean;
}

export interface AdminSettings {
  pricing: PricingSettings;

  membershipPlans: MembershipPlan[];

  coupons: Coupon[];

  maintenanceMode: boolean;

  registrationEnabled: boolean;

  updatedAt: string;
}   