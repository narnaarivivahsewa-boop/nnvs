import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { GET } from "../app/api/social/publish/route";
import { NextRequest } from "next/server";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("==========================================================");
  console.log("🚀 EXECUTING LIVE PARALLEL SOCIAL PUBLISH: PROFILE_SPOTLIGHT");
  console.log("==========================================================");

  const req = new NextRequest("http://localhost:3000/api/social/publish?slot=PROFILE_SPOTLIGHT", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.CRON_SECRET || "rishteclub_secure_cron_key_2026"}`,
    },
  });

  console.log("Invoking /api/social/publish endpoint...");
  const startTime = Date.now();
  const res = await GET(req);
  const data = await res.json();
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\nEndpoint returned HTTP ${res.status} (Duration: ${duration}s):`);
  console.log(JSON.stringify(data, null, 2));

  console.log("\n==========================================================");
  console.log("DATABASE LOG VERIFICATION");
  console.log("==========================================================");

  if (data.logId) {
    const log = await prisma.socialPostLog.findUnique({
      where: { id: data.logId },
    });
    console.log("SocialPostLog entry in DB:", log);
  } else {
    const latest = await prisma.socialPostLog.findFirst({
      orderBy: { createdAt: "desc" },
    });
    console.log("Latest SocialPostLog entry in DB:", latest);
  }

  // Also query Instagram media permalink if published
  if (data.instagramPostId && process.env.META_PAGE_ACCESS_TOKEN) {
    try {
      const igRes = await fetch(
        `https://graph.facebook.com/v21.0/${data.instagramPostId}?fields=id,permalink,timestamp,username&access_token=${process.env.META_PAGE_ACCESS_TOKEN}`
      );
      const igData = await igRes.json();
      console.log("\nLive Instagram Post Details:", igData);
    } catch (err) {
      console.warn("Could not fetch Instagram permalink directly:", err);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);

