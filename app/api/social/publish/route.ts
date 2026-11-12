import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getMetaConfig,
  getIstHour,
  getIstDateString,
  normalizeSlotToCategory,
  resolveSocialSlotFromTime,
  resolveNextRotatedCategory,
  generateSocialCaption,
  postToInstagramBusiness,
  publishToFacebookPage,
  fetchSpotlightProfile,
  normalizeSpotlightPhotoUrl,
  SocialCategory,
  SocialSlot,
  SocialPostParams,
} from "@/lib/social-poster";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isSpotlightSlot(slot: SocialSlot): boolean {
  return normalizeSlotToCategory(slot) === "PROFILE_SPOTLIGHT";
}

function buildOgImageUrl(
  appUrl: string,
  slot: SocialSlot,
  istDate: string,
  candidateData?: SocialPostParams["candidateData"],
  cacheBuster?: number
): string {
  const category = normalizeSlotToCategory(slot);

  if (category === "PROFILE_SPOTLIGHT" && candidateData) {
    const ogParams = new URLSearchParams({
      slot: "PROFILE_SPOTLIGHT",
      id: candidateData.id || "",
      name: candidateData.displayName || "",
      gender: "FEMALE",
      age: String(candidateData.age || "26"),
      height: candidateData.height || "",
      profession: candidateData.profession || "",
      city: candidateData.city || "",
      caste: candidateData.caste || "",
      education: candidateData.education || "",
      photo: candidateData.photoUrl || "",
      d: istDate,
    });
    if (cacheBuster) {
      ogParams.set("nonce", String(cacheBuster));
    }
    return `${appUrl}/api/og/social-post?${ogParams.toString()}`;
  }

  const ogParams = new URLSearchParams({
    slot: category,
    d: istDate,
  });
  if (cacheBuster) {
    ogParams.set("nonce", String(cacheBuster));
  }
  return `${appUrl}/api/og/social-post?${ogParams.toString()}`;
}

/**
 * Common handler for GET and POST requests to /api/social/publish
 */
async function handlePublish(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const config = getMetaConfig();

    // Parse optional JSON body for POST triggers before inspecting auth/options
    let bodyData: Record<string, any> = {};
    if (req.method === "POST") {
      try {
        const contentType = req.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const parsed = await req.json();
          if (parsed && typeof parsed === "object") {
            bodyData = parsed;
          }
        }
      } catch {
        bodyData = {};
      }
    }

    const forceParam = (searchParams.get("force") || "").toLowerCase();
    const force =
      bodyData.force === true || forceParam === "true" || forceParam === "1";

    // 1. Authorization Check: CRON_SECRET, ADMIN_SECRET (required for force=true), or Admin Session
    const authHeader = req.headers.get("authorization") || "";
    const bearerToken = /^Bearer\s+/i.test(authHeader)
      ? authHeader.replace(/^Bearer\s+/i, "").trim()
      : "";
    const headerCronSecret = (req.headers.get("x-cron-secret") || "").trim();
    const headerAdminSecret = (req.headers.get("x-admin-secret") || "").trim();
    const querySecret = (
      searchParams.get("secret") ||
      searchParams.get("key") ||
      ""
    ).trim();
    const queryAdminSecret = (
      searchParams.get("adminSecret") ||
      searchParams.get("admin_secret") ||
      ""
    ).trim();
    const bodySecret =
      typeof bodyData.secret === "string" ? bodyData.secret.trim() : "";
    const bodyAdminSecret =
      typeof bodyData.adminSecret === "string" ? bodyData.adminSecret.trim() : "";

    const suppliedCronTokens = [
      bearerToken,
      headerCronSecret,
      querySecret,
      bodySecret,
    ].filter(Boolean);
    const suppliedAdminTokens = [
      headerAdminSecret,
      queryAdminSecret,
      bodyAdminSecret,
      bearerToken,
      querySecret,
      bodySecret,
    ].filter(Boolean);

    const matchesCronSecret =
      Boolean(config.cronSecret) &&
      suppliedCronTokens.includes(config.cronSecret);
    const matchesAdminSecret =
      Boolean(config.adminSecret) &&
      suppliedAdminTokens.includes(config.adminSecret);

    const adminAuth = await requireAdmin(req);

    let isAuthorized = false;
    let triggeredBy: "CRON" | "ADMIN_TEST" | "ADMIN_FORCE" = "CRON";

    if (force) {
      // Manual fallback trigger (?force=true) strictly protected by Admin Secret or Admin Session
      // (Falls back to CRON_SECRET only when a separate ADMIN_SECRET is not configured in env)
      if (
        matchesAdminSecret ||
        adminAuth.authorized ||
        (!config.adminSecret && matchesCronSecret)
      ) {
        isAuthorized = true;
        triggeredBy = adminAuth.authorized ? "ADMIN_TEST" : "ADMIN_FORCE";
      } else if (config.adminSecret && matchesCronSecret) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Forbidden: force=true manual trigger requires a valid ADMIN_SECRET or authenticated Admin session",
          },
          { status: 403 }
        );
      }
    } else if (matchesCronSecret || matchesAdminSecret || adminAuth.authorized) {
      isAuthorized = true;
      triggeredBy =
        matchesAdminSecret || adminAuth.authorized ? "ADMIN_TEST" : "CRON";
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: force
            ? "Unauthorized: Valid ADMIN_SECRET header/query (x-admin-secret / Bearer) or Admin session required for force=true"
            : "Unauthorized: Valid CRON_SECRET header (Bearer <token> / x-cron-secret) or Admin session required",
        },
        { status: 401 }
      );
    }

    // 2. Determine Content Category (2-Hour 4-Way Rotation Engine when slot omitted / AUTO / ROTATE)
    const now = new Date();
    const istHour = getIstHour(now);
    const istDate = getIstDateString(now);

    const rawSlotParam = (bodyData.slot || searchParams.get("slot") || "").trim();
    const rotateFlag =
      bodyData.rotate === true ||
      (searchParams.get("rotate") || "").toLowerCase() === "true";

    const useAutoRotation =
      rotateFlag ||
      !rawSlotParam ||
      rawSlotParam.toUpperCase() === "AUTO" ||
      rawSlotParam.toUpperCase() === "ROTATE";

    const detectedSlot: SocialSlot = useAutoRotation
      ? await resolveNextRotatedCategory(now)
      : resolveSocialSlotFromTime(rawSlotParam, now);

    let category: SocialCategory = normalizeSlotToCategory(detectedSlot);
    let slot: SocialSlot = category;
    const dryRun =
      bodyData.dryRun === true || searchParams.get("dryRun") === "true";

    let candidateId: string | undefined = undefined;
    let candidateData: SocialPostParams["candidateData"] = undefined;

    // Category A: Female Bride Spotlight (Strict FEMALE + consent + approved reachable photo)
    if (category === "PROFILE_SPOTLIGHT") {
      const requestedCandidateId =
        (typeof bodyData.candidateId === "string" && bodyData.candidateId.trim()) ||
        (searchParams.get("candidateId")?.trim() || undefined);

      const passedCandidate = bodyData.candidateData;
      const passedPhotoUrl = passedCandidate?.photoUrl
        ? normalizeSpotlightPhotoUrl(passedCandidate.photoUrl, config.appUrl)
        : null;

      if (
        passedCandidate &&
        String(passedCandidate.gender || "").toUpperCase() === "FEMALE" &&
        passedPhotoUrl
      ) {
        candidateData = {
          ...passedCandidate,
          gender: "FEMALE",
          photoUrl: passedPhotoUrl,
        };
        candidateId = requestedCandidateId || candidateData?.id;
      } else {
        const spotlight = await fetchSpotlightProfile(
          requestedCandidateId ? { preferredCandidateId: requestedCandidateId } : undefined
        );
        if (spotlight && spotlight.candidateData) {
          candidateId = spotlight.candidateId;
          candidateData = spotlight.candidateData;
        } else {
          console.warn(
            "[Social Publish] No verified consented FEMALE spotlight profile with approved photo available. Rotating to OFFER_99."
          );
          category = "OFFER_99";
          slot = "OFFER_99";
        }
      }
    }

    let topic: SocialCategory = category;

    // 3. Check Admin Setting Toggle (Bypassed explicitly when force=true)
    if (!force) {
      try {
        const setting = await prisma.adminSetting.findFirst();
        if (setting && !setting.socialAutoPostingEnabled && triggeredBy === "CRON") {
          await prisma.socialPostLog.create({
            data: {
              slot,
              platform: "META_ALL",
              status: "SKIPPED",
              candidateId: candidateId || null,
              error:
                "Social auto-posting disabled in admin settings (socialAutoPostingEnabled: false)",
              triggeredBy: "CRON",
            },
          });

          return NextResponse.json({
            success: true,
            skipped: true,
            slot,
            category,
            detectedSlot,
            message: "Social auto-posting is currently toggled OFF in Admin Settings",
          });
        }
      } catch (dbErr) {
        console.warn("[Social Publish] AdminSetting check warning:", dbErr);
      }
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

    const forceNonce = force ? Date.now() : undefined;
    if (!imageUrl) {
      imageUrl = buildOgImageUrl(appUrl, category, istDate, candidateData, forceNonce);
    }

    // 4b. Strict 7-Day Deduplication & Cooldown Guard (Bypassed when force=true or dryRun=true)
    if (!dryRun && !force) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      try {
        const recentDuplicate = await prisma.socialPostLog.findFirst({
          where: {
            status: "SUCCESS",
            createdAt: { gte: sevenDaysAgo },
            NOT: [
              { facebookPostId: { startsWith: "SIM_FB_" } },
              { instagramMediaId: { startsWith: "SIM_IG_" } },
            ],
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
          if (isSpotlightSlot(category)) {
            const freshSpotlight = await fetchSpotlightProfile({
              excludeCandidateIds: candidateId ? [candidateId] : [],
            });
            if (freshSpotlight && freshSpotlight.candidateId !== candidateId) {
              candidateId = freshSpotlight.candidateId;
              candidateData = freshSpotlight.candidateData;
              imageUrl = buildOgImageUrl(
                appUrl,
                category,
                istDate,
                candidateData,
                Date.now()
              );
            } else {
              candidateId = undefined;
              candidateData = undefined;
              category = "OFFER_99";
              slot = "OFFER_99";
              topic = "OFFER_99";
              imageUrl = buildOgImageUrl(
                appUrl,
                category,
                istDate,
                undefined,
                Date.now()
              );
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
      caption = generateSocialCaption(category, { candidateData }, now);
    }

    // 5. Handle Dry Run Simulation (Before live Meta credential check so test fires always simulate cleanly)
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
        forced: force,
        triggeredBy,
        message: "Dry run successful (simulated without publishing to live social channels)",
        slot,
        category,
        detectedSlot,
        topic,
        istHour: Number(istHour.toFixed(2)),
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
              caste: candidateData.caste,
              photoUrl: candidateData.photoUrl,
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

    // 6. Verify Meta Credentials for Live Publish
    const igAccountId = config.instagramAccountId;
    const accessToken = config.pageAccessToken;

    if (!accessToken || (!igAccountId && !config.facebookPageId)) {
      const errMsg =
        "Missing Meta API credentials (META_PAGE_ACCESS_TOKEN or page/account IDs not configured in environment)";
      console.error("[Social Publish Error]:", errMsg);

      try {
        await prisma.socialPostLog.create({
          data: {
            slot,
            platform: "NONE",
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

    // 7. Parallel Execution: Instagram & Facebook Page Publishing
    console.log(
      `[Social Publish] Starting parallel publish for slot: ${slot} (${topic}, forced=${force}, triggeredBy=${triggeredBy})...`
    );
    console.log(`[Social Publish] Image URL: ${imageUrl}`);

    const igToken = config.igAccessToken || accessToken;
    const fbToken = config.pageAccessToken || accessToken;

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
        category,
        detectedSlot,
        topic,
        forced: force,
        triggeredBy,
        istHour: Number(istHour.toFixed(2)),
        platform,
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
              caste: candidateData.caste,
              photoUrl: candidateData.photoUrl,
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
  } catch (error) {
    console.error("[Social Publish Exception]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error occurred while publishing to social channels",
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

