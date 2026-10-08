import crypto from "crypto";

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 10;
export const MAX_OTP_ATTEMPTS = 5;

export function generateOTP(): string {
  const min = 100000;
  const max = 999999;

  return crypto.randomInt(min, max + 1).toString();
}

export function hashOTP(otp: string): string {
  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
}

export function getOTPExpiry(): Date {
  return new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
  );
}

export function verifyOTP(
  plainOTP: string,
  hashedOTP: string
): boolean {
  return hashOTP(plainOTP) === hashedOTP;
}

export function maskMobileNumber(mobile: string): string {
  const clean = mobile.replace(/\D/g, "");
  if (clean.length < 10) return mobile;
  return `${clean.slice(0, 2)}******${clean.slice(-2)}`;
}