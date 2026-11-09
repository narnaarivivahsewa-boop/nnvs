"use client";

export interface RegistrationVerificationState {
  mobile: string;
  token?: string;
  verifiedAt: number;
}

const REG_VERIFICATION_KEY = "nnvs_reg_verification";
const REG_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export function saveRegistrationVerification(
  mobile: string,
  token?: string
): void {
  if (typeof window === "undefined") return;
  try {
    const cleanMobile = String(mobile ?? "").replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) return;

    const payload: RegistrationVerificationState = {
      mobile: cleanMobile,
      token,
      verifiedAt: Date.now(),
    };
    window.localStorage.setItem(REG_VERIFICATION_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota/privacy-mode errors cleanly
  }
}

export function getRegistrationVerification(
  expectedMobile?: string
): RegistrationVerificationState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(REG_VERIFICATION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<RegistrationVerificationState>;
    if (!parsed || typeof parsed.mobile !== "string" || typeof parsed.verifiedAt !== "number") {
      return null;
    }

    if (Date.now() - parsed.verifiedAt > REG_TTL_MS) {
      window.localStorage.removeItem(REG_VERIFICATION_KEY);
      return null;
    }

    if (expectedMobile) {
      const cleanExpected = expectedMobile.replace(/\D/g, "").slice(-10);
      if (parsed.mobile !== cleanExpected) {
        return null;
      }
    }

    return {
      mobile: parsed.mobile,
      token: parsed.token,
      verifiedAt: parsed.verifiedAt,
    };
  } catch {
    return null;
  }
}

export function clearRegistrationVerification(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(REG_VERIFICATION_KEY);
  } catch {
    // Ignore storage errors
  }
}

