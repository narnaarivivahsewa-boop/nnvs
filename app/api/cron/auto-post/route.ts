import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getMetaConfig,
  publishToSocialChannels,
  generateSocialCaption,
  SocialSlot,
} from "@/lib/social-poster";
import { requireAdmin } from "@/lib/admin-auth";

function getIstHour(): number {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const istTotalMinutes = (utcHours * 60 + utcMinutes + 330) % 1440;
  return istTotalMinutes / 60;
}

function resolveCurrentSlot(specifiedSlot?: string | null): SocialSlot {
  if (specifiedSlot) {
    const s = specifiedSlot.toUpperCase();
    if (s === "MORNING" || s === "AFTERNOON" || s === "EVENING" || s === "MANUAL") {
      return s as SocialSlot;
    }
  }

  const istHour = getIstHour();
  if (istHour >= 4 && istHour < 12) {
    return "MORNING"; // 09:30 AM IST window
  } else if (istHour >= 12 && istHour < 17) {
    return "AFTERNOON"; // 02:00 PM IST window
  } else {
    return "EVENING"; // 07:30 PM IST window
  }
}

export async function GET(req: NextRequest) {
  return handleAutoPost(req, "GET");
}

export async function POST(req: NextRequest) {
  return handleAutoPost(req, "POST");
}

async function handleAutoPost(req: NextRequest, method: "GET" | "POST") {
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
      // Check Admin Session
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

    // 2. Check AdminSetting toggle
    let setting = await prisma.adminSetting.findFirst();
    if (setting && !setting.socialAutoPostingEnabled && triggeredBy === "CRON") {
      // Record SKIPPED log
      await prisma.socialPostLog.create({
        data: {
          slot: resolveCurrentSlot(searchParams.get("slot")),
          platform: "META_ALL",
          status: "SKIPPED",
          error: "Auto-posting disabled in admin settings (socialAutoPostingEnabled: false)",
          triggeredBy: "CRON",
        },
      });

      return NextResponse.json({
        success: true,
        skipped: true,
        message: "Auto-posting is currently toggled OFF in Admin Settings",
      });
    }

    // 3. Determine Slot
    const slot = resolveCurrentSlot(searchParams.get("slot"));
    const isDryRun = searchParams.get("dryRun") === "true";

    let ogParams = new URLSearchParams();
    ogParams.set("slot", slot);

    let candidateData: any = undefined;
    let candidateId: string | undefined = undefined;

    // 4. Candidate selection for AFTERNOON slot
    if (slot === "AFTERNOON") {
      const explicitCandidateId = searchParams.get("candidateId");
      let profile = null;

      if (explicitCandidateId) {
        profile = await prisma.profile.findFirst({
          where: {
            OR: [
              { id: explicitCandidateId },
              { profileId: explicitCandidateId },
              { legacyProfileId: explicitCandidateId },
            ],
          },
          include: {
            user: { select: { gender: true, fullName: true } },
            education: { select: { highestQualification: true } },
            occupation: { select: { profession: true } },
          },
        });
      }

      if (!profile) {
        // Pick a verified candidate
        profile = await prisma.profile.findFirst({
          where: {
            isVisible: true,
            approvalStatus: "APPROVED",
            paymentCompleted: true,
          },
          orderBy: { updatedAt: "desc" },
          include: {
            user: { select: { gender: true, fullName: true } },
            education: { select: { highestQualification: true } },
            occupation: { select: { profession: true } },
          },
        });
      }

      // Fallback if no approved profiles found yet
      if (!profile) {
        profile = await prisma.profile.findFirst({
          where: { approvalStatus: { in: ["APPROVED", "PENDING_APPROVAL", "UNDER_REVIEW"] } },
          include: {
            user: { select: { gender: true, fullName: true } },
            education: { select: { highestQualification: true } },
            occupation: { select: { profession: true } },
          },
        });
      }

      if (profile) {
        candidateId = profile.id;
        const dob = profile.dateOfBirth;
        let age = "26";
        if (dob) {
          const diff = Date.now() - new Date(dob).getTime();
          age = String(Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)));
        }

        const isFemale = profile.user?.gender === "FEMALE";
        candidateData = {
          id: profile.legacyProfileId || profile.profileId,
          gender: (profile.user?.gender || (isFemale ? "FEMALE" : "MALE")) as "MALE" | "FEMALE",
          age,
          height: profile.height || (isFemale ? "5'4\"" : "5'10\""),
          caste: profile.caste || "Hindu",
          gotra: "Gotra Available",
          profession: profile.occupation?.profession || "Working Professional",
          city: profile.birthPlace || "Delhi NCR",
          education: profile.education?.highestQualification || "Graduate",
        };

        ogParams.set("id", candidateData.id);
        ogParams.set("gender", candidateData.gender);
        ogParams.set("age", candidateData.age);
        ogParams.set("height", candidateData.height);
        ogParams.set("profession", candidateData.profession);
        ogParams.set("education", candidateData.education);
        ogParams.set("city", candidateData.city);
        ogParams.set("caste", candidateData.caste);
        ogParams.set("gotra", candidateData.gotra);
      }
    }

    // 5. Construct full public image URL
    const imageUrl = `${config.appUrl}/api/og/social-post?${ogParams.toString()}`;
    const caption = generateSocialCaption(slot, { candidateData });

    // 6. Publish via Meta Graph API (or Dry Run)
    const result = await publishToSocialChannels({
      slot,
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
      status: result.status,
      triggeredBy,
      imageUrl: result.imageUrl,
      caption: result.caption,
      logId: result.logId,
      facebook: result.facebook,
      instagram: result.instagram,
      dryRun: result.dryRun,
      error: result.error,
    });
  } catch (error: any) {
    console.error("[Cron Auto-Post Error]:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to execute auto-post" },
      { status: 500 }
    );
  }
}
