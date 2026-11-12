import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getMetaConfig,
  publishToSocialChannels,
  generateSocialCaption,
  fetchSpotlightProfile,
  normalizeSlotToCategory,
  resolveSocialSlotFromTime,
  resolveNextRotatedCategory,
  getIstDateString,
  SocialCategory,
  SocialSlot,
  SocialPostParams,
} from "@/lib/social-poster";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  return handleAutoPost(req);
}

export async function POST(req: NextRequest) {
  return handleAutoPost(req);
}

async function handleAutoPost(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const config = getMetaConfig();

    // 1. Authorization: Bearer CRON_SECRET, ?secret=..., or Authenticated Admin
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const querySecret = searchParams.get("secret");

    let isAuthorized = false;
    let triggeredBy: "CRON" | "ADMIN_TEST" = "CRON";

    if (config.cronSecret && (bearerToken === config.cronSecret || querySecret === config.cronSecret)) {
      isAuthorized = true;
      triggeredBy = "CRON";
    } else {
      const adminAuth = await requireAdmin(req);
      if (adminAuth.authorized) {
        isAuthorized = true;
        triggeredBy = "ADMIN_TEST";
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Invalid CRON_SECRET or Admin session required" },
        { status: 401 }
      );
    }

    const now = new Date();
    const istDate = getIstDateString(now);
    const rawSlotParam = (searchParams.get("slot") || "").trim();
    const useAutoRotation =
      !rawSlotParam ||
      rawSlotParam.toUpperCase() === "AUTO" ||
      rawSlotParam.toUpperCase() === "ROTATE";

    const detectedSlot: SocialSlot = useAutoRotation
      ? await resolveNextRotatedCategory(now)
      : resolveSocialSlotFromTime(rawSlotParam, now);

    let category: SocialCategory = normalizeSlotToCategory(detectedSlot);

    // 2. Check AdminSetting toggle
    const setting = await prisma.adminSetting.findFirst();
    if (setting && !setting.socialAutoPostingEnabled && triggeredBy === "CRON") {
      await prisma.socialPostLog.create({
        data: {
          slot: category,
          platform: "META_ALL",
          status: "SKIPPED",
          error: "Auto-posting disabled in admin settings (socialAutoPostingEnabled: false)",
          triggeredBy: "CRON",
        },
      });

      return NextResponse.json({
        success: true,
        skipped: true,
        category,
        message: "Auto-posting is currently toggled OFF in Admin Settings",
      });
    }

    const isDryRun = searchParams.get("dryRun") === "true";
    const ogParams = new URLSearchParams();
    ogParams.set("d", istDate);

    let candidateData: SocialPostParams["candidateData"] = undefined;
    let candidateId: string | undefined = undefined;

    // 3. Strict FEMALE Bride Spotlight selection for Category A
    if (category === "PROFILE_SPOTLIGHT") {
      const explicitCandidateId = searchParams.get("candidateId")?.trim() || undefined;
      const spotlight = await fetchSpotlightProfile(
        explicitCandidateId ? { preferredCandidateId: explicitCandidateId } : undefined
      );

      if (spotlight && spotlight.candidateData && spotlight.candidateData.photoUrl) {
        const verifiedPhotoUrl = spotlight.candidateData.photoUrl;
        candidateId = spotlight.candidateId;
        candidateData = spotlight.candidateData;

        ogParams.set("slot", "PROFILE_SPOTLIGHT");
        ogParams.set("id", candidateData.id);
        ogParams.set("name", candidateData.displayName || "Verified Bride");
        ogParams.set("gender", "FEMALE");
        ogParams.set("age", String(candidateData.age));
        ogParams.set("height", candidateData.height);
        ogParams.set("profession", candidateData.profession);
        ogParams.set("education", candidateData.education || "Graduate");
        ogParams.set("city", candidateData.city);
        ogParams.set("caste", candidateData.caste);
        ogParams.set("gotra", candidateData.gotra);
        ogParams.set("photo", verifiedPhotoUrl);
      } else {
        console.warn(
          "[Cron Auto-Post] No verified consented FEMALE spotlight profile with approved photo available. Rotating to OFFER_99."
        );
        category = "OFFER_99";
        ogParams.set("slot", "OFFER_99");
      }
    } else {
      ogParams.set("slot", category);
    }

    // 4. Construct full public image URL & category caption
    const imageUrl = `${config.appUrl}/api/og/social-post?${ogParams.toString()}`;
    const caption = generateSocialCaption(category, { candidateData }, now);

    // 5. Publish via Meta Graph API (or Dry Run)
    const result = await publishToSocialChannels({
      slot: category,
      imageUrl,
      caption,
      candidateId,
      candidateData,
      triggeredBy,
      dryRun: isDryRun,
    });

    return NextResponse.json({
      success: result.success,
      slot: result.slot,
      category,
      status: result.status,
      triggeredBy,
      candidateId: candidateId || null,
      candidateData: candidateData
        ? {
            id: candidateData.id,
            displayName: candidateData.displayName,
            gender: candidateData.gender,
            age: candidateData.age,
            height: candidateData.height,
            education: candidateData.education,
            profession: candidateData.profession,
            city: candidateData.city,
            photoUrl: candidateData.photoUrl,
          }
        : undefined,
      imageUrl: result.imageUrl,
      caption: result.caption,
      logId: result.logId,
      facebook: result.facebook,
      instagram: result.instagram,
      dryRun: result.dryRun,
      error: result.error,
    });
  } catch (error) {
    console.error("[Cron Auto-Post Error]:", error);
    return NextResponse.json(
      { success: false, message: "Failed to execute auto-post" },
      { status: 500 }
    );
  }
}
