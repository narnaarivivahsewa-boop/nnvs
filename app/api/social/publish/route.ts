import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getMetaConfig,
  generateSocialCaption,
  postToInstagramBusiness,
  publishToFacebookPage,
  fetchSpotlightProfile,
  SocialSlot,
  SocialPostParams,
} from "@/lib/social-poster";

export const runtime = "nodejs";

function getIstHour(): number {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const istTotalMinutes = (utcHours * 60 + utcMinutes + 330) % 1440;
  return istTotalMinutes / 60;
}

function resolveSlotFromTime(specifiedSlot?: string | null): SocialSlot {
  if (specifiedSlot) {
    const s = specifiedSlot.toUpperCase();
    if (
      s === "MORNING" ||
      s === "AFTERNOON" ||
      s === "EVENING" ||
      s === "MANUAL" ||
      s === "KUNDLI_MILAN" ||
      s === "PROFILE_SPOTLIGHT" ||
      s === "PROMOTION" ||
      s === "REGISTRATION" ||
      s === "MATCHMAKING_TIPS"
    ) {
      return s as SocialSlot;
    }
  }

  const istHour = getIstHour();
  if (istHour >= 4 && istHour < 12) {
    return "MORNING"; // 09:00 AM IST Window: Free Kundali Milan Promotion & Astrology Tips
  } else if (istHour >= 12 && istHour < 17) {
    return "AFTERNOON"; // 02:00 PM IST Window: Live Verified Profile Spotlight
  } else {
    return "EVENING"; // 07:00 PM IST Window: Platform Promotion & Registration Awareness
  }
}

function resolveTopicFromSlot(
  slot: SocialSlot
): "KUNDLI_MILAN" | "PROFILE_SPOTLIGHT" | "PROMOTION" {
  if (slot === "MORNING" || slot === "KUNDLI_MILAN") return "KUNDLI_MILAN";
  if (slot === "AFTERNOON" || slot === "PROFILE_SPOTLIGHT") return "PROFILE_SPOTLIGHT";
  return "PROMOTION";
}

/**
 * Common handler for GET and POST requests to /api/social/publish
 */
async function handlePublish(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const config = getMetaConfig();

    // 1. Authorization Check: Bearer CRON_SECRET, Query Secret, or Admin Session
    const authHeader = req.headers.get("authorization") || "";
    const bearerToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    const querySecret = (searchParams.get("secret") || searchParams.get("key") || "").trim();

    let isAuthorized = false;
    let triggeredBy: "CRON" | "ADMIN_TEST" = "CRON";

    if (
      config.cronSecret &&
      (bearerToken === config.cronSecret || querySecret === config.cronSecret)
    ) {
      isAuthorized = true;
      triggeredBy = "CRON";
    } else {
      // Check Admin Session
      const adminAuth = await requireAdmin(req);
      if (adminAuth.authorized) {
        isAuthorized = true;
        triggeredBy = "ADMIN_TEST";
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Valid CRON_SECRET header (Bearer <token>) or Admin session required",
        },
        { status: 401 }
      );
    }

    // 2. Parse Body / Query parameters
    let bodyData: any = {};
    if (req.method === "POST") {
      try {
        const contentType = req.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          bodyData = await req.json();
        }
      } catch {
        bodyData = {};
      }
    }

    const slotParam = bodyData.slot || searchParams.get("slot");
    let slot = resolveSlotFromTime(slotParam);
    const dryRun = bodyData.dryRun === true || searchParams.get("dryRun") === "true";

    let candidateId: string | undefined = undefined;
    let candidateData: SocialPostParams["candidateData"] = undefined;

    // Slot 2: Afternoon Slot -> LIVE VERIFIED PROFILE SPOTLIGHT
    if (slot === "AFTERNOON" || slot === "PROFILE_SPOTLIGHT") {
      if (bodyData.candidateData) {
        candidateData = bodyData.candidateData;
        candidateId = bodyData.candidateId || candidateData?.id;
        slot = "PROFILE_SPOTLIGHT";
      } else {
        const spotlight = await fetchSpotlightProfile();
        if (spotlight && spotlight.candidateData) {
          candidateId = spotlight.candidateId;
          candidateData = spotlight.candidateData;
          slot = "PROFILE_SPOTLIGHT";
        } else {
          console.warn("[Social Publish] No spotlight profile with photo available. Falling back to PROMOTION.");
          slot = "PROMOTION";
        }
      }
    }

    const topic = resolveTopicFromSlot(slot);

    // 3. Check Admin Setting Toggle
    try {
      const setting = await prisma.adminSetting.findFirst();
      if (setting && !setting.socialAutoPostingEnabled && triggeredBy === "CRON") {
        await prisma.socialPostLog.create({
          data: {
            slot,
            platform: "META_ALL",
            status: "SKIPPED",
            candidateId: candidateId || null,
            error: "Social auto-posting disabled in admin settings (socialAutoPostingEnabled: false)",
            triggeredBy: "CRON",
          },
        });

        return NextResponse.json({
          success: true,
          skipped: true,
          message: "Social auto-posting is currently toggled OFF in Admin Settings",
        });
      }
    } catch (dbErr) {
      console.warn("[Social Publish] AdminSetting check warning:", dbErr);
    }

    // 4. Resolve Image URL & Caption
    // Public Base URL: Meta servers require an externally reachable HTTPS domain
    const appUrl = config.appUrl;

    let imageUrl = bodyData.imageUrl || searchParams.get("imageUrl");

    // Strict Banner Ban: Reject static website marriage banners (e.g., DSC00173.JPG or /images/wedding/)
    if (
      imageUrl &&
      (imageUrl.includes("DSC00173") ||
        imageUrl.includes("/images/wedding/") ||
        imageUrl.includes("hero") ||
        imageUrl.endsWith(".JPG") ||
        imageUrl.endsWith(".jpg"))
    ) {
      console.warn(
        `[Social Publish] Rejected static website banner image (${imageUrl}). Replacing with dynamic OG graphic card.`
      );
      imageUrl = null;
    }

    if (!imageUrl) {
      if (slot === "PROFILE_SPOTLIGHT" && candidateData) {
        const ogParams = new URLSearchParams({
          slot: "PROFILE_SPOTLIGHT",
          id: candidateData.id || "",
          name: candidateData.displayName || "",
          gender: candidateData.gender || "FEMALE",
          age: String(candidateData.age || "26"),
          height: candidateData.height || "",
          profession: candidateData.profession || "",
          city: candidateData.city || "",
          caste: candidateData.caste || "",
          education: candidateData.education || "",
          photo: candidateData.photoUrl || "",
          t: String(Date.now()),
        });
        imageUrl = `${appUrl}/api/og/social-post?${ogParams.toString()}`;
      } else if (slot === "MORNING" || slot === "KUNDLI_MILAN") {
        imageUrl = `${appUrl}/api/og/social-post?slot=KUNDLI_MILAN&t=${Date.now()}`;
      } else {
        // EVENING / PROMOTION / REGISTRATION
        imageUrl = `${appUrl}/api/og/social-post?slot=PROMOTION&t=${Date.now()}`;
      }
    }

    // 4b. Strict 7-Day Deduplication & Cooldown Guard
    if (!dryRun) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      try {
        const recentDuplicate = await prisma.socialPostLog.findFirst({
          where: {
            status: "SUCCESS",
            createdAt: { gte: sevenDaysAgo },
            OR: [
              ...(candidateId ? [{ candidateId }] : []),
              { imageUrl },
            ],
          },
          orderBy: { createdAt: "desc" },
        });

        if (recentDuplicate) {
          console.warn(
            `[Social Publish] 7-day cooldown triggered (recent post ID: ${recentDuplicate.id}). Applying rotation & cache-buster.`
          );
          if (slot === "PROFILE_SPOTLIGHT") {
            const freshSpotlight = await fetchSpotlightProfile();
            if (freshSpotlight && freshSpotlight.candidateId !== candidateId) {
              candidateId = freshSpotlight.candidateId;
              candidateData = freshSpotlight.candidateData;
              const freshParams = new URLSearchParams({
                slot: "PROFILE_SPOTLIGHT",
                id: candidateData.id || "",
                name: candidateData.displayName || "",
                gender: candidateData.gender || "FEMALE",
                age: String(candidateData.age || "26"),
                height: candidateData.height || "",
                profession: candidateData.profession || "",
                city: candidateData.city || "",
                caste: candidateData.caste || "",
                education: candidateData.education || "",
                photo: candidateData.photoUrl || "",
                t: String(Date.now()),
              });
              imageUrl = `${appUrl}/api/og/social-post?${freshParams.toString()}`;
            } else {
              slot = "PROMOTION";
              imageUrl = `${appUrl}/api/og/social-post?slot=PROMOTION&t=${Date.now()}`;
            }
          } else {
            const sep = imageUrl.includes("?") ? "&" : "?";
            imageUrl = `${imageUrl}${sep}nonce=${Date.now()}`;
          }
        }
      } catch (dedupErr) {
        console.warn("[Social Publish] Deduplication check warning:", dedupErr);
      }
    }

    let caption = bodyData.caption || searchParams.get("caption");
    if (!caption) {
      caption = generateSocialCaption(slot, { candidateData });
    }

    // 5. Verify Meta Instagram Credentials
    const igAccountId = config.instagramAccountId;
    const accessToken = config.pageAccessToken;

    if (!igAccountId || !accessToken) {
      const errMsg = "Missing Meta Instagram credentials (META_IG_ACCOUNT_ID or META_IG_ACCESS_TOKEN not configured in environment)";
      console.error("[Social Publish Error]:", errMsg);

      try {
        await prisma.socialPostLog.create({
          data: {
            slot,
            platform: "INSTAGRAM",
            imageUrl,
            caption,
            status: "FAILED",
            error: errMsg,
            triggeredBy,
          },
        });
      } catch (logErr) {
        console.error("[Social Post Log Error]:", logErr);
      }

      return NextResponse.json(
        { success: false, error: errMsg },
        { status: 500 }
      );
    }

    // 6. Handle Dry Run Simulation
    if (dryRun) {
      const simulatedIgId = `SIM_IG_${Date.now()}`;
      const simulatedFbId = `SIM_FB_${Date.now()}`;
      let logId: string | undefined = undefined;
      try {
        const logRecord = await prisma.socialPostLog.create({
          data: {
            slot,
            platform: "META_ALL",
            imageUrl,
            caption,
            status: "SUCCESS",
            candidateId: candidateId || null,
            instagramMediaId: simulatedIgId,
            facebookPostId: simulatedFbId,
            triggeredBy,
          },
        });
        logId = logRecord.id;
      } catch (logErr) {
        console.error("[Social Post Log Error]:", logErr);
      }

      return NextResponse.json({
        success: true,
        dryRun: true,
        message: "Dry run successful (simulated without publishing to live social channels)",
        slot,
        topic,
        candidateId: candidateId || null,
        candidateData: candidateData
          ? {
              id: candidateData.id,
              displayName: candidateData.displayName,
              age: candidateData.age,
              profession: candidateData.profession,
              city: candidateData.city,
            }
          : undefined,
        imageUrl,
        caption,
        instagramPostId: simulatedIgId,
        facebookPostId: simulatedFbId,
        instagram: { success: true, postId: simulatedIgId },
        facebook: { success: true, postId: simulatedFbId },
        logId,
      });
    }

    // 7. Parallel Execution: Instagram & Facebook Page Publishing
    console.log(`[Social Publish] Starting parallel publish for slot: ${slot} (${topic})...`);
    console.log(`[Social Publish] Image URL: ${imageUrl}`);

    const igToken = process.env.META_IG_ACCESS_TOKEN || accessToken;
    const fbToken = process.env.META_PAGE_ACCESS_TOKEN || accessToken;

    const [igSettled, fbSettled] = await Promise.allSettled([
      igAccountId && igToken
        ? postToInstagramBusiness(imageUrl, caption, igAccountId, igToken)
        : Promise.resolve({ success: false, error: "Missing Instagram credentials" }),
      config.facebookPageId && fbToken
        ? publishToFacebookPage({
            imageUrl,
            caption,
            pageId: config.facebookPageId,
            accessToken: fbToken,
          })
        : Promise.resolve({ success: false, error: "Missing Facebook credentials" }),
    ]);

    const igResult: { success: boolean; mediaId?: string; creationId?: string; error?: string } =
      igSettled.status === "fulfilled"
        ? igSettled.value
        : { success: false, error: igSettled.reason?.message || "Instagram publish rejected" };

    const fbResult: { success: boolean; postId?: string; permalinkUrl?: string; error?: string } =
      fbSettled.status === "fulfilled"
        ? fbSettled.value
        : { success: false, error: fbSettled.reason?.message || "Facebook publish rejected" };

    const isSuccess = igResult.success || fbResult.success;
    const platform =
      igResult.success && fbResult.success
        ? "META_ALL"
        : igResult.success
        ? "INSTAGRAM"
        : fbResult.success
        ? "FACEBOOK"
        : "NONE";

    // 8. Log Execution Result to Database
    let logId: string | undefined = undefined;
    try {
      const logRecord = await prisma.socialPostLog.create({
        data: {
          slot,
          platform,
          imageUrl,
          caption,
          status: isSuccess ? "SUCCESS" : "FAILED",
          candidateId: candidateId || null,
          instagramMediaId: igResult.mediaId || null,
          facebookPostId: fbResult.postId || null,
          error: [igResult.error, fbResult.error].filter(Boolean).join(" | ") || null,
          triggeredBy,
        },
      });
      logId = logRecord.id;
    } catch (logErr) {
      console.error("[Social Publish Log Warning]:", logErr);
    }

    // 9. Return Response
    return NextResponse.json(
      {
        success: isSuccess,
        message: isSuccess
          ? `Post published successfully to ${platform}`
          : "Failed to publish post to social channels",
        slot,
        topic,
        platform,
        candidateId: candidateId || null,
        candidateData: candidateData
          ? {
              id: candidateData.id,
              displayName: candidateData.displayName,
              age: candidateData.age,
              profession: candidateData.profession,
              city: candidateData.city,
            }
          : undefined,
        instagramPostId: igResult.mediaId || null,
        facebookPostId: fbResult.postId || null,
        facebookPermalink: fbResult.permalinkUrl || (fbResult.postId ? `https://www.facebook.com/${fbResult.postId}` : null),
        instagram: {
          success: igResult.success,
          postId: igResult.mediaId,
          containerId: igResult.creationId,
          error: igResult.error,
        },
        facebook: {
          success: fbResult.success,
          postId: fbResult.postId,
          permalinkUrl: fbResult.permalinkUrl,
          error: fbResult.error,
        },
        imageUrl,
        caption,
        logId,
        timestamp: new Date().toISOString(),
      },
      { status: isSuccess ? 200 : 400 }
    );
  } catch (error: any) {
    console.error("[Social Publish Exception]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error occurred while publishing to social channels",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handlePublish(req);
}

export async function POST(req: NextRequest) {
  return handlePublish(req);
}

