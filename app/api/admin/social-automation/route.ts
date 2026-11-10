import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getMetaConfig,
  publishToSocialChannels,
  generateSocialCaption,
  fetchSpotlightProfile,
  normalizeSpotlightPhotoUrl,
  normalizeSlotToCategory,
  buildSpotlightCandidateData,
  getIstDateString,
  SocialCategory,
  SocialPostParams,
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
        approvalStatus: "APPROVED",
        isVisible: true,
        consentSocialMedia: true,
        user: {
          gender: "FEMALE",
          status: "ACTIVE",
        },
        OR: [
          { legacyProfileId: null },
          { NOT: { legacyProfileId: { startsWith: "NNVS-B" } } },
        ],
        photos: {
          some: {
            status: "APPROVED",
            OR: [
              { imageUrl: { startsWith: "https://" } },
              { imageUrl: { startsWith: "http://" } },
            ],
          },
        },
      },
      take: 30,
      orderBy: { updatedAt: "desc" },
      include: {
        user: { select: { gender: true, fullName: true } },
        photos: {
          where: {
            status: "APPROVED",
            OR: [
              { imageUrl: { startsWith: "https://" } },
              { imageUrl: { startsWith: "http://" } },
            ],
          },
          orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
          take: 1,
        },
        occupation: { select: { profession: true } },
        education: { select: { highestQualification: true } },
      },
    });

    const formattedCandidates = activeCandidates
      .map((p) => {
        const photoUrl = normalizeSpotlightPhotoUrl(p.photos[0]?.imageUrl, config.appUrl);
        if (!photoUrl) return null;
        const data = buildSpotlightCandidateData(p, photoUrl);
        return {
          id: p.id,
          displayId: data.id,
          displayName: data.displayName || "Verified Bride",
          fullName: [p.firstName, p.lastName].filter(Boolean).join(" ") || p.user?.fullName || p.profileId,
          gender: "FEMALE" as const,
          age: data.age,
          height: data.height,
          caste: data.caste,
          gotra: data.gotra,
          profession: data.profession,
          city: data.city,
          education: data.education || "Graduate",
          photoUrl,
        };
      })
      .filter(Boolean);

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
      defaultCaptions: {
        OFFER_99: generateSocialCaption("OFFER_99"),
        KUNDLI_MILAN: generateSocialCaption("KUNDLI_MILAN"),
        TRUST_VERIFIED: generateSocialCaption("TRUST_VERIFIED"),
      },
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
      const category: SocialCategory = normalizeSlotToCategory(body.slot || "PROFILE_SPOTLIGHT");
      const dryRun = Boolean(body.dryRun ?? false);
      const config = getMetaConfig();
      const istDate = getIstDateString();

      let candidateData: SocialPostParams["candidateData"] = undefined;
      let candidateId: string | undefined = body.candidateId || undefined;

      const ogParams = new URLSearchParams();
      ogParams.set("d", istDate);

      if (category === "PROFILE_SPOTLIGHT") {
        const spotlight = await fetchSpotlightProfile(
          candidateId ? { preferredCandidateId: String(candidateId) } : undefined
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
          return NextResponse.json(
            {
              success: false,
              message:
                "No eligible FEMALE profile found with social consent and a verified downloadable photo.",
            },
            { status: 422 }
          );
        }
      } else {
        ogParams.set("slot", category);
      }

      const imageUrl = `${config.appUrl}/api/og/social-post?${ogParams.toString()}`;
      const caption = body.customCaption || generateSocialCaption(category, { candidateData });

      const result = await publishToSocialChannels({
        slot: category,
        imageUrl,
        caption,
        candidateId,
        candidateData,
        triggeredBy: "ADMIN_TEST",
        dryRun,
      });

      return NextResponse.json({
        success: result.success,
        slot: category,
        category,
        status: result.status,
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
