import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { prisma } from "../lib/prisma";
import {
  getMetaConfig,
  generateSocialCaption,
  publishToFacebookPage,
} from "../lib/social-poster";

async function main() {
  console.log("==================================================");
  console.log("PUBLISHING PROFILE SPOTLIGHT (NNVS-B-0041) TO FACEBOOK PAGE");
  console.log("==================================================\n");

  const config = getMetaConfig();
  console.log("Target Facebook Page ID:", config.facebookPageId);

  // 1. Fetch Profile from Database
  console.log(">>> [1/4] Fetching profile NNVS-B-0041 from database...");
  const profile = await prisma.profile.findFirst({
    where: {
      OR: [
        { legacyProfileId: "NNVS-B-0041" },
        { profileId: "NNVS-B-0041" },
      ],
    },
    include: {
      user: { select: { fullName: true, gender: true } },
      photos: {
        where: { imageUrl: { startsWith: "http" } },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
        take: 1,
      },
      education: { select: { highestQualification: true } },
      occupation: { select: { profession: true } },
    },
  });

  if (!profile) {
    console.error("ERROR: Profile with ID 'NNVS-B-0041' not found in database!");
    process.exit(1);
  }

  console.log("Found profile in DB:", {
    dbId: profile.id,
    profileId: profile.profileId,
    legacyProfileId: profile.legacyProfileId,
    userFullName: profile.user?.fullName,
    photoUrl: profile.photos[0]?.imageUrl,
  });

  // 2. Prepare Safe Candidate Data (Strict Privacy Guard)
  console.log("\n>>> [2/4] Formatting safe candidate attributes & caption...");

  let age = "26";
  if (profile.dateOfBirth) {
    const diff = Date.now() - new Date(profile.dateOfBirth).getTime();
    age = String(Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)));
  }

  // Name Anonymization: First Name + Initial only (e.g. "Rohit K.")
  const rawFirstName =
    profile.firstName?.trim() ||
    profile.user?.fullName?.trim()?.split(/\s+/)[0] ||
    "Rohit";
  const rawLastName =
    profile.lastName?.trim() ||
    profile.user?.fullName?.trim()?.split(/\s+/).slice(1).join(" ") ||
    "K";
  const initial = rawLastName ? ` ${rawLastName.charAt(0).toUpperCase()}.` : "";
  const displayName = `${rawFirstName}${initial}`;

  let cleanCity = profile.birthPlace?.trim() || "Meerut";
  cleanCity = cleanCity.replace(/\b\d{6}\b/g, "").replace(/\s+/g, " ").trim();

  const cleanProfession =
    profile.occupation?.profession?.trim() || "Whole sale trader";
  const isFemale = profile.user?.gender === "FEMALE";
  const displayId = profile.legacyProfileId || profile.profileId || "NNVS-B-0041";
  const photoUrl = profile.photos[0]?.imageUrl || "";

  const candidateData = {
    id: displayId,
    displayName,
    gender: (profile.user?.gender || (isFemale ? "FEMALE" : "MALE")) as "MALE" | "FEMALE",
    age,
    height: profile.height || "5'7\"",
    caste: profile.caste || "Hindu",
    gotra: "Gotra Available",
    profession: cleanProfession,
    city: cleanCity,
    education: profile.education?.highestQualification || "B.com",
    photoUrl,
  };

  // Generate Caption
  const caption = generateSocialCaption("PROFILE_SPOTLIGHT", { candidateData });
  console.log("Generated Caption:\n----------------------------------------");
  console.log(caption);
  console.log("----------------------------------------");

  // Generate Dynamic OG Image URL (1080x1080 feed format)
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
  console.log("\n>>> [3/4] Generated Dynamic OG Image URL:\n", imageUrl);

  // 3. Dispatch Live Post to Facebook Page
  console.log("\n>>> [4/4] Publishing photo post to Facebook Page (1445842498610887)...");
  const fbResult = await publishToFacebookPage({
    imageUrl,
    caption,
    pageId: "1445842498610887",
  });

  console.log("\nFacebook Page Publish API Result:", fbResult);

  if (!fbResult.success || !fbResult.postId) {
    console.error("FAIL: Could not publish post to Facebook Page:", fbResult.error);
    process.exit(1);
  }

  // 4. Resolve Direct Public Facebook Post URL via Meta Graph API
  let directPublicUrl = `https://www.facebook.com/${fbResult.postId}`;
  try {
    const accRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${config.pageAccessToken}`
    );
    const accData = await accRes.json();
    const pageToken =
      accData.data?.find((p: any) => p.id === "1445842498610887")?.access_token ||
      config.pageAccessToken;

    const freshPageRes = await fetch(
      `https://graph.facebook.com/v21.0/${fbResult.postId}?fields=permalink_url&access_token=${pageToken}`
    );
    const freshPageData = await freshPageRes.json();
    if (freshPageData?.permalink_url) {
      directPublicUrl = freshPageData.permalink_url;
    }
  } catch (urlErr) {
    console.warn("Notice: Could not fetch permalink_url directly, using standard link");
  }

  // 5. Save to SocialPostLog
  try {
    const log = await prisma.socialPostLog.create({
      data: {
        slot: "PROFILE_SPOTLIGHT",
        platform: "FACEBOOK",
        imageUrl,
        caption,
        status: "SUCCESS",
        facebookPostId: fbResult.postId,
        candidateId: profile.id,
        triggeredBy: "ADMIN_TEST",
      },
    });
    console.log("Logged to database SocialPostLog with ID:", log.id);
  } catch (logErr) {
    console.error("Database log warning:", logErr);
  }

  console.log("\n==================================================");
  console.log("SUCCESS! PROFILE SPOTLIGHT PUBLISHED TO FACEBOOK");
  console.log("==================================================");
  console.log("Facebook Post ID:", fbResult.postId);
  console.log("Direct Public Facebook Post URL:", directPublicUrl);
  console.log("==================================================");

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

