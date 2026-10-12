import { POST } from "../app/api/auth/login-password/route";
import { NextRequest } from "next/server";
import { prisma } from "../lib/prisma";
import { verifyToken } from "../lib/jwt";

async function testLogin() {
  console.log("--- Testing API Endpoint: /api/auth/login-password ---");

  // Pick a sample member user
  const sample = await prisma.user.findFirst({
    where: { role: "MEMBER", mobile: { not: { startsWith: "9900" } } },
    select: { mobile: true, fullName: true, id: true },
  });

  if (!sample) {
    throw new Error("No sample user found");
  }

  console.log(`Attempting login for: ${sample.fullName} with Mobile: ${sample.mobile} and Password: NNVS@RC2026`);

  const req = new NextRequest("http://localhost:3000/api/auth/login-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: sample.mobile,
      password: "NNVS@RC2026",
    }),
  });

  const res = await POST(req);
  const data = await res.json();

  console.log("HTTP Response Status:", res.status);
  console.log("Response Body:", data);

  const cookie = res.cookies.get("nnvs_token");
  console.log("Cookie 'nnvs_token' present:", !!cookie);

  if (cookie?.value) {
    const payload = await verifyToken(cookie.value);
    console.log("Decoded Token Payload:", payload);
    console.log("✓ Login verification completely successful without any 2FA/OTP prompt!");
  } else {
    throw new Error("Authentication failed: No session cookie issued.");
  }
}

testLogin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
