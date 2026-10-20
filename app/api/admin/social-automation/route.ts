import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getMetaConfig,
  publishToSocialChannels,
  generateSocialCaption,
  SocialSlot,
} from "@/lib/social-poster";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return auth.response;
    }

    let setting = await prisma.adminSetting.findFirst();
    if (!setting) {
      setting = await prisma.adminSetting.create({
        data: {
          socialAutoPostingEnabled: true,
        },
      });
    }

    const config = getMetaConfig();

    const logs = await prisma.socialPostLog.findMany({
      take: 40,
      orderBy: { createdAt: "desc" },
    });

    const activeCandidates = await prisma.profile.findMany({
      where: {
        approvalStatus: { in: ["APPROVED", "PENDING_APPROVAL", "UNDER_REVIEW"] },
      },
      take: 15,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        profileId: true,
        legacyProfileId: true,
        firstName: true,
        lastName: true,
        caste: true,
        birthPlace: true,
        height: true,
        dateOfBirth: true,
        user: { select: { gender: true, fullName: true } },
        occupation: { select: { profession: true } },
        education: { select: { highestQualification: true } },
      },
    });

    const formattedCandidates = activeCandidates.map((p) => {
      let age = "26";
      if (p.dateOfBirth) {
        const diff = Date.now() - new Date(p.dateOfBirth).getTime();
        age = String(Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)));
      }
      const isFemale = p.user?.gender === "FEMALE";
      return {
        id: p.id,
        displayId: p.legacyProfileId || p.profileId,
        fullName: [p.firstName, p.lastName].filter(Boolean).join(" ") || p.user?.fullName || p.profileId,
        gender: p.user?.gender || (isFemale ? "FEMALE" : "MALE"),
        age,
        height: p.height || (isFemale ? "5'4\"" : "5'10\""),
        caste: p.caste || "Agarwal",
        gotra: "Garg Gotra",
        profession: p.occupation?.profession || "Working Professional",
        city: p.birthPlace || "Delhi NCR",
        education: p.education?.highestQualification || "Graduate",
      };
    });

    return NextResponse.json({
      success: true,
      settings: {
        socialAutoPostingEnabled: setting.socialAutoPostingEnabled ?? true,
      },
      metaConfig: {
        isConfigured: config.isConfigured,
        hasFacebook: config.hasFacebook,
        hasInstagram: config.hasInstagram,
        hasToken: Boolean(config.pageAccessToken),
        hasCronSecret: Boolean(config.cronSecret),
        facebookPageId: config.facebookPageId ? `***${config.facebookPageId.slice(-4)}` : null,
        instagramAccountId: config.instagramAccountId ? `***${config.instagramAccountId.slice(-4)}` : null,
        appUrl: config.appUrl,
      },
      logs,
      candidates: formattedCandidates,
    });
  } catch (error: any) {
    console.error("[Admin Social Automation GET Error]:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch social automation state" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const { action } = body;

    // Action 1: Toggle Auto-Posting ON/OFF
    if (action === "toggle") {
      const { enabled } = body;
      let setting = await prisma.adminSetting.findFirst();

      if (!setting) {
        setting = await prisma.adminSetting.create({
          data: {
            socialAutoPostingEnabled: Boolean(enabled),
          },
        });
      } else {
        setting = await prisma.adminSetting.update({
          where: { id: setting.id },
          data: {
            socialAutoPostingEnabled: Boolean(enabled),
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Social auto-posting turned ${enabled ? "ON" : "OFF"}`,
        settings: {
          socialAutoPostingEnabled: setting.socialAutoPostingEnabled,
        },
      });
    }

    // Action 2: Test Post Now (with Live or Dry Run)
    if (action === "test_post") {
      const slot: SocialSlot = (body.slot || "MORNING").toUpperCase() as SocialSlot;
      const dryRun = Boolean(body.dryRun ?? false);
      const config = getMetaConfig();

      let candidateData: any = undefined;
      let candidateId = body.candidateId;

      const ogParams = new URLSearchParams();
      ogParams.set("slot", slot);

      if (slot === "AFTERNOON") {
        let profile = null;
        if (candidateId) {
          profile = await prisma.profile.findFirst({
            where: {
              OR: [{ id: candidateId }, { profileId: candidateId }, { legacyProfileId: candidateId }],
            },
            include: {
              user: { select: { gender: true, fullName: true } },
              education: { select: { highestQualification: true } },
              occupation: { select: { profession: true } },
            },
          });
        }

        if (!profile) {
          profile = await prisma.profile.findFirst({
            where: { approvalStatus: { in: ["APPROVED", "PENDING_APPROVAL"] } },
            include: {
              user: { select: { gender: true, fullName: true } },
              education: { select: { highestQualification: true } },
              occupation: { select: { profession: true } },
            },
          });
        }

        if (profile) {
          candidateId = profile.id;
          let age = "26";
          if (profile.dateOfBirth) {
            const diff = Date.now() - new Date(profile.dateOfBirth).getTime();
            age = String(Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)));
          }

          const isFemale = profile.user?.gender === "FEMALE";
          candidateData = {
            id: profile.legacyProfileId || profile.profileId,
            gender: (profile.user?.gender || (isFemale ? "FEMALE" : "MALE")) as "MALE" | "FEMALE",
            age,
            height: profile.height || (isFemale ? "5'4\"" : "5'10\""),
            caste: profile.caste || "Agarwal",
            gotra: "Garg Gotra",
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

      const imageUrl = `${config.appUrl}/api/og/social-post?${ogParams.toString()}`;
      const caption = body.customCaption || generateSocialCaption(slot, { candidateData });

      const result = await publishToSocialChannels({
        slot,
        imageUrl,
        caption,
        candidateId,
        candidateData,
        triggeredBy: "ADMIN_TEST",
        dryRun,
      });

      return NextResponse.json({
        success: result.success,
        slot,
        status: result.status,
        imageUrl,
        caption,
        dryRun: result.dryRun,
        facebook: result.facebook,
        instagram: result.instagram,
        logId: result.logId,
        error: result.error,
      });
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[Admin Social Automation POST Error]:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
