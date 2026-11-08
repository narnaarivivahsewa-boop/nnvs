import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { getMetaConfig, generateSocialCaption, postToInstagramBusiness } from "../lib/social-poster";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("=== 1. Checking Meta Configuration ===");
  const config = getMetaConfig();
  console.log({
    isConfigured: config.isConfigured,
    hasInstagram: config.hasInstagram,
    instagramAccountId: config.instagramAccountId,
    tokenPrefix: config.pageAccessToken ? `${config.pageAccessToken.slice(0, 15)}...` : "None",
    cronSecret: config.cronSecret,
    appUrl: config.appUrl,
  });

  if (!config.isConfigured || !config.instagramAccountId) {
    throw new Error("Meta Instagram credentials are not configured!");
  }

  console.log("\n=== 2. Testing 3 Daily Post Captions ===");
  const morningCaption = generateSocialCaption("MORNING");
  console.log("--- Morning (Free Kundali Milan) ---");
  console.log(morningCaption.slice(0, 120) + "...\n");

  const afternoonCaption = generateSocialCaption("AFTERNOON");
  console.log("--- Afternoon (Registration Awareness) ---");
  console.log(afternoonCaption.slice(0, 120) + "...\n");

  const eveningCaption = generateSocialCaption("EVENING");
  console.log("--- Evening (Matchmaking / Astrology Tips) ---");
  console.log(eveningCaption.slice(0, 120) + "...\n");

  console.log("=== 3. Executing Live Test Publish to Instagram @rishteclub ===");
  // We use the dynamic branded 1080x1080 OG post card
  const testImageUrl = `${config.appUrl}/api/og/social-post?slot=KUNDLI_MILAN&t=${Date.now()}`;
  const testCaption =
    `✨ 100% Free AI Kundali Milan & 36 Guna Match Report ✨\n` +
    `Platform: RishteClub Matrimony (Powered by NNVS)\n\n` +
    `विवाह से पहले वर-वधू की कुंडली का सटीक अष्टकूट मिलान (वर्ण, वश्य, तारा, योनि, ग्रह मैत्री, गण, भकूट, नाड़ी) अब बिल्कुल निःशुल्क।\n\n` +
    `⭐ Key Highlights:\n` +
    `• 36 Guna Ashtakoot Score & Detailed Hindi Analysis\n` +
    `• Manglik Dosha Verification & Vedic Remedies\n` +
    `• Free Downloadable Vedic Matchmaking Certificate (PDF)\n` +
    `• No App Installation Needed — Fast, Confidential & 100% Free\n\n` +
    `👉 Check Your Kundali Milan Instantly:\n` +
    `🌐 https://www.rishteclub.com/kundli-milan\n\n` +
    `📞 Matchmaking & Astrological Helpline:\n` +
    `• WhatsApp / Call: +91 9871592002 | +91 7015812359\n\n` +
    `#KundaliMilan #FreeKundali #GunMilan #VedicAstrology #36Guna #ManglikDosha #RishteClub #HoroscopeMatching #HinduMatrimony #Shaadi #IndianWedding`;

  console.log(`Target Instagram Account ID: ${config.instagramAccountId}`);
  console.log(`Image URL: ${testImageUrl}`);
  console.log("Creating container, waiting 4.5s, and publishing via Graph API v21.0...");

  const result = await postToInstagramBusiness(
    testImageUrl,
    testCaption,
    config.instagramAccountId,
    config.pageAccessToken
  );

  console.log("\n=== 4. Publish Result ===");
  console.log(result);

  if (result.success && result.mediaId) {
    console.log(`\n🎉 SUCCESS! Published Post ID: ${result.mediaId}`);
    console.log(`Container ID: ${result.creationId}`);

    // Verify it in DB
    const log = await prisma.socialPostLog.create({
      data: {
        slot: "MORNING",
        platform: "INSTAGRAM",
        imageUrl: testImageUrl,
        caption: testCaption,
        status: "SUCCESS",
        instagramMediaId: result.mediaId,
        triggeredBy: "ADMIN_TEST",
      },
    });
    console.log(`Logged to database with ID: ${log.id}`);
  } else {
    console.error("❌ FAILED to publish:", result.error);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});

