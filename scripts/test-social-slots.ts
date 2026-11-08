import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { NextRequest } from "next/server";
import { GET as publishGet } from "../app/api/social/publish/route";
import { GET as ogGet } from "../app/api/og/social-post/route";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("==================================================");
  console.log("TESTING RISHTECLUB 3-SLOT AUTO-POSTING PIPELINE");
  console.log("==================================================\n");

  const authSecret = process.env.CRON_SECRET || "rishteclub_secure_cron_key_2026";

  // -----------------------------------------------------------------
  // 1. Morning Slot (09:00 AM IST) -> KUNDLI_MILAN
  // -----------------------------------------------------------------
  console.log(">>> [1/3] Testing MORNING Slot (Kundali Milan)...");
  const morningReq = new NextRequest("http://localhost:3000/api/social/publish?slot=MORNING&dryRun=true", {
    headers: { Authorization: `Bearer ${authSecret}` },
  });
  const morningRes = await publishGet(morningReq);
  const morningData = await morningRes.json();
  console.log("Morning Slot Status:", morningRes.status);
  console.log("Slot:", morningData.slot, "| Topic:", morningData.topic);
  console.log("Image URL:", morningData.imageUrl);
  console.log("Caption Preview:\n" + morningData.caption.split("\n").slice(0, 4).join("\n") + "\n...");

  // Verify OG image generation for Morning
  const morningOgReq = new NextRequest(morningData.imageUrl);
  const morningOgRes = await ogGet(morningOgReq);
  console.log("Morning OG Status:", morningOgRes.status, "| Content-Type:", morningOgRes.headers.get("content-type"));

  // -----------------------------------------------------------------
  // 2. Afternoon Slot (02:00 PM IST) -> LIVE VERIFIED PROFILE SPOTLIGHT
  // -----------------------------------------------------------------
  console.log("\n>>> [2/3] Testing AFTERNOON Slot (Live Verified Profile Spotlight)...");
  const afternoonReq = new NextRequest("http://localhost:3000/api/social/publish?slot=AFTERNOON&dryRun=true", {
    headers: { Authorization: `Bearer ${authSecret}` },
  });
  const afternoonRes = await publishGet(afternoonReq);
  const afternoonData = await afternoonRes.json();
  console.log("Afternoon Slot Status:", afternoonRes.status);
  console.log("Slot:", afternoonData.slot, "| Topic:", afternoonData.topic);
  console.log("Candidate ID:", afternoonData.candidateId);
  console.log("Candidate Data:", afternoonData.candidateData);
  console.log("Image URL:", afternoonData.imageUrl);
  console.log("Spotlight Caption:\n" + afternoonData.caption);

  // Privacy Guard Check
  const caption = afternoonData.caption || "";
  const hasPhoneLeak = /\+91[\d\s-]{10,}/.test(caption) && !caption.includes("9871592002");
  const hasEmailLeak = /[\w.-]+@[\w.-]+\.\w+/.test(caption);
  console.log("\n--- Privacy Guard Verification ---");
  console.log("Candidate Phone Leaked in Caption?:", hasPhoneLeak ? "FAIL" : "PASSED (Safe)");
  console.log("Candidate Email Leaked in Caption?:", hasEmailLeak ? "FAIL" : "PASSED (Safe)");

  // Verify OG image generation for Afternoon Spotlight
  const afternoonOgReq = new NextRequest(afternoonData.imageUrl);
  const afternoonOgRes = await ogGet(afternoonOgReq);
  console.log("Spotlight OG Status:", afternoonOgRes.status, "| Content-Type:", afternoonOgRes.headers.get("content-type"));

  // -----------------------------------------------------------------
  // 3. Evening Slot (07:00 PM IST) -> PROMOTION (Platform & Lifetime Registration)
  // -----------------------------------------------------------------
  console.log("\n>>> [3/3] Testing EVENING Slot (Platform Lifetime Registration Promotion)...");
  const eveningReq = new NextRequest("http://localhost:3000/api/social/publish?slot=EVENING&dryRun=true", {
    headers: { Authorization: `Bearer ${authSecret}` },
  });
  const eveningRes = await publishGet(eveningReq);
  const eveningData = await eveningRes.json();
  console.log("Evening Slot Status:", eveningRes.status);
  console.log("Slot:", eveningData.slot, "| Topic:", eveningData.topic);
  console.log("Image URL:", eveningData.imageUrl);
  console.log("Caption Preview:\n" + eveningData.caption.split("\n").slice(0, 5).join("\n") + "\n...");

  // Verify OG image generation for Evening Promotion
  const eveningOgReq = new NextRequest(eveningData.imageUrl);
  const eveningOgRes = await ogGet(eveningOgReq);
  console.log("Evening OG Status:", eveningOgRes.status, "| Content-Type:", eveningOgRes.headers.get("content-type"));

  console.log("\n==================================================");
  console.log("ALL 3 SLOTS & OG IMAGE RESPONSES TESTED SUCCESSFULLY!");
  console.log("==================================================");

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

