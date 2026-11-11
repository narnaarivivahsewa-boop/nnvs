import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

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

export type VerifiedSession = {
  userId: string;
  mobile: string;
  role: string;
  activeProfileId?: string;
};

/**
 * Determine whether outgoing Set-Cookie directives should set the `Secure` attribute.
 * Uses the actual request protocol / proxy header so HTTPS production stays Secure
 * while HTTP localhost/LAN staging (`next start`) still accepts cookies.
 */
export function isSecureCookieRequest(req: NextRequest): boolean {
  const forwardedProto = req.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  if (forwardedProto) {
    return forwardedProto === "https";
  }

  const nextProto = req.nextUrl?.protocol?.toLowerCase();
  if (nextProto === "https:") return true;
  if (nextProto === "http:") {
    const host = (
      req.headers.get("host") ||
      req.nextUrl?.hostname ||
      ""
    ).toLowerCase();
    if (
      host.startsWith("localhost") ||
      host.startsWith("127.0.0.1") ||
      host.startsWith("0.0.0.0") ||
      host.endsWith(".local")
    ) {
      return false;
    }
  }

  return process.env.NODE_ENV === "production";
}

/**
 * Prevents multi-megabyte inline `data:` base64 photos from bloating auth JSON
 * payloads and overflowing mobile `localStorage` quotas.
 */
export function sanitizeProfilePhotoUrl(
  imageUrl?: string | null,
  profileId?: string | null
): string | null {
  if (!imageUrl || typeof imageUrl !== "string") return null;
  const trimmed = imageUrl.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("data:")) {
    if (trimmed.length <= 2048) return trimmed;
    return profileId
      ? `/api/profiles/${encodeURIComponent(profileId)}/photo`
      : null;
  }

  return trimmed;
}

export function extractAuthTokens(req: NextRequest): {
  cookieToken: string | null;
  headerToken: string | null;
  primaryToken: string | null;
} {
  const cookieToken = req.cookies.get(AUTH_COOKIE_NAME)?.value?.trim() || null;
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7).trim() || null
    : null;
  const xHeaderToken = req.headers.get("x-nnvs-token")?.trim() || null;
  const headerToken = bearerToken || xHeaderToken;

  return {
    cookieToken,
    headerToken,
    primaryToken: cookieToken || headerToken,
  };
}

export async function verifyRequestSession(req: NextRequest): Promise<{
  session: VerifiedSession | null;
  token: string | null;
  cookieToken: string | null;
  headerToken: string | null;
  cookieWasInvalid: boolean;
}> {
  const { cookieToken, headerToken } = extractAuthTokens(req);
  let cookieWasInvalid = false;

  if (cookieToken) {
    try {
      const session = await verifyToken(cookieToken);
      return {
        session,
        token: cookieToken,
        cookieToken,
        headerToken,
        cookieWasInvalid: false,
      };
    } catch {
      cookieWasInvalid = true;
    }
  }

  if (headerToken && headerToken !== cookieToken) {
    try {
      const session = await verifyToken(headerToken);
      return {
        session,
        token: headerToken,
        cookieToken,
        headerToken,
        cookieWasInvalid,
      };
    } catch {
      // Fallback header token is also invalid/expired
    }
  }

  return {
    session: null,
    token: null,
    cookieToken,
    headerToken,
    cookieWasInvalid,
  };
}

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