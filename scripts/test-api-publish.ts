import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { GET, POST } from "../app/api/social/publish/route";
import { NextRequest } from "next/server";
import { prisma } from "../lib/prisma";

async function run() {
  console.log("=== 1. Test Unauthorized Access (No Token) ===");
  const req1 = new NextRequest("http://localhost:3000/api/social/publish");
  const res1 = await GET(req1);
  console.log("Status:", res1.status, await res1.json());

  console.log("\n=== 2. Test Invalid Token ===");
  const req2 = new NextRequest("http://localhost:3000/api/social/publish", {
    headers: { Authorization: "Bearer wrong_secret" },
  });
  const res2 = await GET(req2);
  console.log("Status:", res2.status, await res2.json());

  console.log("\n=== 3. Test Authorized Dry Run (Morning Slot) ===");
  const req3 = new NextRequest("http://localhost:3000/api/social/publish?slot=MORNING&dryRun=true", {
    headers: { Authorization: "Bearer rishteclub_secure_cron_key_2026" },
  });
  const res3 = await GET(req3);
  console.log("Status:", res3.status, await res3.json());

  console.log("\n=== 4. Test Authorized POST Dry Run (Afternoon Slot) ===");
  const req4 = new NextRequest("http://localhost:3000/api/social/publish?secret=rishteclub_secure_cron_key_2026", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slot: "AFTERNOON", dryRun: true }),
  });
  const res4 = await POST(req4);
  console.log("Status:", res4.status, await res4.json());

  console.log("\n=== 5. Check Database Log Entries ===");
  const logs = await prisma.socialPostLog.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slot: true,
      platform: true,
      status: true,
      instagramMediaId: true,
      createdAt: true,
    },
  });
  console.log("Latest logs in DB:", logs);

  await prisma.$disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

