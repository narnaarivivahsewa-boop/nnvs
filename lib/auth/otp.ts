import crypto from "crypto";

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 5;

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

export function printDevelopmentOTP(
  mobile: string,
  otp: string
) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const timeStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  console.log("\n========================================================");
  console.log("🔔 [NNVS / RISHTECLUB AUTH OTP SERVER TERMINAL]");
  console.log(`⏰ Time   : ${timeStr} (IST)`);
  console.log(`📱 Mobile : ${mobile}`);
  console.log(`🔑 OTP    : ${otp}`);
  console.log("========================================================\n");
}