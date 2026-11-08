import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { getMetaConfig, publishToFacebookPage } from "../lib/social-poster";
import { GET, POST } from "../app/api/social/publish/route";
import { NextRequest } from "next/server";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("=== 1. Checking Configuration ===");
  const config = getMetaConfig();
  console.log({
    hasFacebook: config.hasFacebook,
    facebookPageId: config.facebookPageId,
    hasInstagram: config.hasInstagram,
    instagramAccountId: config.instagramAccountId,
    tokenPrefix: config.pageAccessToken ? `${config.pageAccessToken.slice(0, 15)}...` : "None",
  });

  console.log("\n=== 2. Testing /api/social/publish Dry Run (Parallel IG + FB) ===");
  const dryReq = new NextRequest("http://localhost:3000/api/social/publish?slot=MORNING&dryRun=true", {
    headers: { Authorization: "Bearer rishteclub_secure_cron_key_2026" },
  });
  const dryRes = await GET(dryReq);
  const dryJson = await dryRes.json();
  console.log("Dry Run Response:", JSON.stringify(dryJson, null, 2));

  console.log("\n=== 3. Testing Direct Facebook Page Publish Call ===");
  const testImageUrl = "https://www.rishteclub.com/images/wedding/DSC00173.JPG";
  const testCaption = "RishteClub Matrimony - Official Community Matching";

  const fbResult = await publishToFacebookPage({
    imageUrl: testImageUrl,
    caption: testCaption,
    pageId: config.facebookPageId,
    accessToken: config.pageAccessToken,
  });
  console.log("Facebook Page Publish Result:", fbResult);

  console.log("\n=== 4. Testing Live /api/social/publish Parallel Execution ===");
  const liveReq = new NextRequest("http://localhost:3000/api/social/publish?slot=MORNING", {
    method: "POST",
    headers: {
      Authorization: "Bearer rishteclub_secure_cron_key_2026",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      imageUrl: testImageUrl,
      caption: testCaption,
    }),
  });
  const liveRes = await POST(liveReq);
  const liveJson = await liveRes.json();
  console.log("Live Endpoint Result Status:", liveRes.status);
  console.log("Live Endpoint Result Body:", JSON.stringify(liveJson, null, 2));

  console.log("\n=== 5. Database Log Verification ===");
  const latestLog = await prisma.socialPostLog.findFirst({
    orderBy: { createdAt: "desc" },
  });
  console.log("Latest SocialPostLog Entry in DB:", latestLog);

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

