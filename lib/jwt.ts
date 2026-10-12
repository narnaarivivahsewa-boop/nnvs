import { SignJWT, jwtVerify } from "jose";

function getSecretKey(): Uint8Array {
  const secretStr =
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "8d75c66cd68a500b809290d3e570f387f513353e16f72465267e6e900fe6e2ac";
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