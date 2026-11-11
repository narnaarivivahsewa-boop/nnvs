import crypto from "crypto";

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 10;
export const MAX_OTP_ATTEMPTS = 5;
export const OTP_VERIFY_IDEMPOTENCY_MS = 5000;

export function generateOTP(): string {
  const min = 100000;
  const max = 999999;

  return crypto.randomInt(min, max + 1).toString();
}

export function hashOTP(otp: string): string {
  return crypto
    .createHash("sha256")
    .update(String(otp ?? "").trim())
    .digest("hex");
}

export function markOtpCodeVerified(
  storedCode: string,
  plainOtp: string,
  verifiedAtMs: number = Date.now()
): string {
  const { baseCode } = parseOtpCodeRecord(storedCode);
  return `${baseCode}|VERIFIED:${verifiedAtMs}|${hashOTP(plainOtp)}`;
}

export function parseOtpCodeRecord(storedCode: string): {
  baseCode: string;
  verifiedAtMs: number | null;
  verifiedOtpHash: string | null;
} {
  const raw = String(storedCode ?? "");
  const marker = "|VERIFIED:";
  const markerIdx = raw.indexOf(marker);

  if (markerIdx === -1) {
    return {
      baseCode: raw,
      verifiedAtMs: null,
      verifiedOtpHash: null,
    };
  }

  const baseCode = raw.slice(0, markerIdx);
  const tail = raw.slice(markerIdx + marker.length);
  const [tsPart, hashPart] = tail.split("|");
  const parsedTs = Number.parseInt(tsPart || "", 10);

  return {
    baseCode,
    verifiedAtMs: Number.isFinite(parsedTs) ? parsedTs : null,
    verifiedOtpHash: hashPart || null,
  };
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