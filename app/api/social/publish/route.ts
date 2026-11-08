import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getMetaConfig,
  generateSocialCaption,
  postToInstagramBusiness,
  SocialSlot,
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
      s === "REGISTRATION" ||
      s === "MATCHMAKING_TIPS"
    ) {
      return s as SocialSlot;
    }
  }

  const istHour = getIstHour();
  if (istHour >= 4 && istHour < 12) {
    return "MORNING"; // 09:00 AM IST Window: Free Kundali Milan Promotion
  } else if (istHour >= 12 && istHour < 17) {
    return "AFTERNOON"; // 02:00 PM IST Window: Matrimony Registration Awareness
  } else {
    return "EVENING"; // 07:00 PM IST Window: Matchmaking / Astrological Relationship Tips
  }
}

function resolveTopicFromSlot(slot: SocialSlot): "KUNDLI_MILAN" | "REGISTRATION" | "MATCHMAKING_TIPS" {
  if (slot === "MORNING" || slot === "KUNDLI_MILAN") return "KUNDLI_MILAN";
  if (slot === "AFTERNOON" || slot === "REGISTRATION") return "REGISTRATION";
  return "MATCHMAKING_TIPS";
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
    const slot = resolveSlotFromTime(slotParam);
    const topic = resolveTopicFromSlot(slot);
    const dryRun = bodyData.dryRun === true || searchParams.get("dryRun") === "true";

    // 3. Check Admin Setting Toggle
    try {
      const setting = await prisma.adminSetting.findFirst();
      if (setting && !setting.socialAutoPostingEnabled && triggeredBy === "CRON") {
        await prisma.socialPostLog.create({
          data: {
            slot,
            platform: "INSTAGRAM",
            status: "SKIPPED",
            error: "Instagram auto-posting disabled in admin settings (socialAutoPostingEnabled: false)",
            triggeredBy: "CRON",
          },
        });

        return NextResponse.json({
          success: true,
          skipped: true,
          message: "Instagram auto-posting is currently toggled OFF in Admin Settings",
        });
      }
    } catch (dbErr) {
      console.warn("[Social Publish] AdminSetting check warning:", dbErr);
    }

    // 4. Resolve Image URL & Caption
    // Public Base URL: Meta servers require an externally reachable HTTPS domain
    const appUrl = config.appUrl;

    let imageUrl = bodyData.imageUrl || searchParams.get("imageUrl");
    if (!imageUrl) {
      // Dynamic OG post image route optimized for 1080x1080 Instagram feed
      const ogSlot = topic === "KUNDLI_MILAN" ? "MORNING" : topic === "REGISTRATION" ? "AFTERNOON" : "EVENING";
      imageUrl = `${appUrl}/api/og/social-post?slot=${ogSlot}&topic=${topic}&t=${Date.now()}`;
    }

    let caption = bodyData.caption || searchParams.get("caption");
    if (!caption) {
      caption = generateSocialCaption(slot);
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
      const simulatedId = `SIM_IG_${Date.now()}`;
      try {
        await prisma.socialPostLog.create({
          data: {
            slot,
            platform: "INSTAGRAM",
            imageUrl,
            caption,
            status: "SUCCESS",
            instagramMediaId: simulatedId,
            triggeredBy,
          },
        });
      } catch (logErr) {
        console.error("[Social Post Log Error]:", logErr);
      }

      return NextResponse.json({
        success: true,
        dryRun: true,
        message: "Dry run successful (simulated without publishing to live Instagram)",
        slot,
        topic,
        imageUrl,
        caption,
        simulatedMediaId: simulatedId,
      });
    }

    // 7. Execute 3-Step Instagram Publishing Flow
    console.log(`[Social Publish] Starting Instagram publish for slot: ${slot} (${topic})...`);
    console.log(`[Social Publish] Image URL: ${imageUrl}`);

    const publishResult = await postToInstagramBusiness(
      imageUrl,
      caption,
      igAccountId,
      accessToken
    );

    // 8. Log Execution Result to Database
    let logId: string | undefined = undefined;
    try {
      const logRecord = await prisma.socialPostLog.create({
        data: {
          slot,
          platform: "INSTAGRAM",
          imageUrl,
          caption,
          status: publishResult.success ? "SUCCESS" : "FAILED",
          instagramMediaId: publishResult.mediaId || null,
          error: publishResult.error || null,
          triggeredBy,
        },
      });
      logId = logRecord.id;
    } catch (logErr) {
      console.error("[Social Publish Log Warning]:", logErr);
    }

    // 9. Return Response
    if (!publishResult.success) {
      console.error("[Social Publish Error]:", publishResult.error);
      return NextResponse.json(
        {
          success: false,
          error: publishResult.error || "Failed to publish post to Instagram",
          containerId: publishResult.creationId,
          slot,
          topic,
          imageUrl,
          logId,
        },
        { status: 400 }
      );
    }

    console.log(`[Social Publish Success] Instagram Media ID: ${publishResult.mediaId}`);
    return NextResponse.json({
      success: true,
      message: "Instagram post successfully published to @rishteclub",
      slot,
      topic,
      postId: publishResult.mediaId,
      containerId: publishResult.creationId,
      imageUrl,
      caption,
      logId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Social Publish Exception]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error occurred while publishing to Instagram",
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

