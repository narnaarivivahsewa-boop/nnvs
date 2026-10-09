import { SignJWT, jwtVerify } from "jose";

function getSecretKey(): Uint8Array {
  const secretStr =
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET ||
    "nnvs-matrimony-production-super-secure-jwt-secret-key-2026-min-32-chars";
  return new TextEncoder().encode(secretStr);
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