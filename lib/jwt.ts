import { SignJWT, jwtVerify } from "jose";

function getSecretKey(): Uint8Array {
  const secretStr = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secretStr || secretStr.trim().length < 32) {
    throw new Error(
      "CRITICAL SECURITY CONFIGURATION ERROR: JWT_SECRET environment variable is missing or shorter than 32 characters."
    );
  }
  return new TextEncoder().encode(secretStr.trim());
}

export async function generateToken(
  userId: string,
  mobile: string,
  role: string
) {
  return await new SignJWT({
    userId,
    mobile,
    role,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, getSecretKey());

  return {
    userId: String(payload.userId),
    mobile: String(payload.mobile),
    role: String(payload.role),
  };
}