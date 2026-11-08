import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { getMetaConfig, publishToFacebookPage, generateSocialCaption } from "../lib/social-poster";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("==================================================================");
  console.log("🚀 EXECUTING LIVE 2-STEP FEED STORY PUBLISH: CANDIDATE NNVS-B-0026");
  console.log("==================================================================");

  const config = getMetaConfig();
  console.log("Target Page ID:", config.facebookPageId);

  const candidateData = {
    id: "NNVS-B-0026",
    displayName: "Rohit K.",
    gender: "MALE" as const,
    age: "36",
    height: "5'6\"",
    caste: "Hindu",
    gotra: "Gotra Available",
    profession: "Whole sale trader",
    city: "Meerut",
    education: "B com",
    photoUrl: "https://lh3.googleusercontent.com/d/1uDeGtteZO1GaldRrPj5YMPgf0g3jaQBP",
  };

  const ogParams = new URLSearchParams({
    slot: "PROFILE_SPOTLIGHT",
    id: candidateData.id,
    name: candidateData.displayName,
    gender: candidateData.gender,
    age: String(candidateData.age),
    height: candidateData.height,
    profession: candidateData.profession,
    city: candidateData.city,
    caste: candidateData.caste,
    education: candidateData.education,
    photo: candidateData.photoUrl,
    t: String(Date.now()),
  });

  const imageUrl = `${config.appUrl}/api/og/social-post?${ogParams.toString()}`;
  const caption = generateSocialCaption("PROFILE_SPOTLIGHT", { candidateData });

  console.log("Image URL:", imageUrl);
  console.log("Caption preview:\n" + caption);

  console.log("\nExecuting publishToFacebookPage (2-Step Timeline Feed Flow)...");
  const startTime = Date.now();
  const result = await publishToFacebookPage({
    imageUrl,
    caption,
    pageId: config.facebookPageId,
    accessToken: config.pageAccessToken,
  });
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\nResult (Duration: ${duration}s):`, result);

  if (result.success && result.postId) {
    console.log("\n🎉 SUCCESS! Feed Post ID:", result.postId);
    console.log("Universal Direct Permalink:", result.permalinkUrl);

    // Save to SocialPostLog
    const log = await prisma.socialPostLog.create({
      data: {
        slot: "PROFILE_SPOTLIGHT",
        platform: "FACEBOOK",
        imageUrl,
        caption,
        status: "SUCCESS",
        facebookPostId: result.postId,
        candidateId: "cmuyyq9s600cvl406qexlwjbu",
        triggeredBy: "ADMIN_TEST",
      },
    });
    console.log("Logged to database with ID:", log.id);
  } else {
    console.error("FAIL:", result.error);
    process.exit(1);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
