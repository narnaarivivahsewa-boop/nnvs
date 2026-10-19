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
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days in seconds

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