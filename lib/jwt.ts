import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET!
);

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
    .sign(secret);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret);

  return {
    userId: String(payload.userId),
    mobile: String(payload.mobile),
    role: String(payload.role),
  };
}