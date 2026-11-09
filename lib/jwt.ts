import { SignJWT, jwtVerify } from "jose";

function getSecretKey(): Uint8Array {
  const secretStr =
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "8d75c66cd68a500b809290d3e570f387f513353e16f72465267e6e900fe6e2ac";
  return new TextEncoder().encode(secretStr.trim());
}

export const AUTH_COOKIE_NAME = "nnvs_token";
export const ACTIVE_PROFILE_COOKIE_NAME = "activeProfileId";
export const REG_VERIFICATION_COOKIE_NAME = "nnvs_reg_token";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days in seconds
export const REG_VERIFICATION_MAX_AGE = 60 * 60 * 2; // 2 hours in seconds

export async function generateRegistrationToken(mobile: string) {
  const cleanMobile = String(mobile ?? "").replace(/\D/g, "").slice(-10);
  return await new SignJWT({
    mobile: cleanMobile,
    purpose: "REGISTRATION_VERIFIED",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(getSecretKey());
}

export async function verifyRegistrationToken(token: string) {
  const { payload } = await jwtVerify(token, getSecretKey());
  if (payload.purpose !== "REGISTRATION_VERIFIED") {
    throw new Error("Invalid registration verification token purpose");
  }
  return {
    mobile: String(payload.mobile),
    purpose: String(payload.purpose),
  };
}

export async function generateToken(
  userId: string,
  mobile: string,
  role: string,
  activeProfileId?: string | null
) {
  const payload: Record<string, any> = {
    userId,
    mobile,
    role,
  };

  if (activeProfileId) {
    payload.activeProfileId = activeProfileId;
  }

  return await new SignJWT(payload)
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(getSecretKey());
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, getSecretKey());

  return {
    userId: String(payload.userId),
    mobile: String(payload.mobile),
    role: String(payload.role),
    activeProfileId: payload.activeProfileId ? String(payload.activeProfileId) : undefined,
  };
}