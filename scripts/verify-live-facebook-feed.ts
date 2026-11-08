import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { getMetaConfig, publishToFacebookPage, generateSocialCaption } from "../lib/social-poster";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("=== Verifying Live Facebook Page Timeline Feed Publishing ===");
  const config = getMetaConfig();
  console.log("Target Page ID:", config.facebookPageId);

  // Generate dynamic Promotion OG card (NOT a static hero image!)
  const imageUrl = `${config.appUrl}/api/og/social-post?slot=PROMOTION&t=${Date.now()}`;
  const caption = generateSocialCaption("PROMOTION");

  console.log("Publishing Dynamic OG Card:", imageUrl);
  console.log("Caption preview:", caption.slice(0, 100), "...");

  const result = await publishToFacebookPage({
    imageUrl,
    caption,
    pageId: config.facebookPageId,
    accessToken: config.pageAccessToken,
  });

  console.log("\nFacebook Page Publish Result:", result);

  if (result.success && result.postId) {
    console.log("🎉 SUCCESS! Published Post ID:", result.postId);
    console.log("Canonical Permalink URL:", result.permalinkUrl);

    // Save to database
    const log = await prisma.socialPostLog.create({
      data: {
        slot: "PROMOTION",
        platform: "FACEBOOK",
        imageUrl,
        caption,
        status: "SUCCESS",
        facebookPostId: result.postId,
        triggeredBy: "ADMIN_TEST",
      },
    });
    console.log("Recorded to SocialPostLog with ID:", log.id);
  } else {
    console.error("FAIL:", result.error);
  }

  await prisma.$disconnect();
}

main().catch(console.error);

