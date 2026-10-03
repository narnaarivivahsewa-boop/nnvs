import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { maskMobileNumber } from "@/lib/duplicate-detector";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const flaggedProfiles = await prisma.profile.findMany({
      where: {
        isDuplicateFlagged: true,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            mobile: true,
            email: true,
            gender: true,
          },
        },
        family: true,
        occupation: true,
        education: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Enrich with matched profile information if available
    const enriched = await Promise.all(
      flaggedProfiles.map(async (p) => {
        let matchedProfile: any = null;
        if (p.duplicateMatchedProfileId) {
          matchedProfile = await prisma.profile.findFirst({
            where: {
              OR: [
                { id: p.duplicateMatchedProfileId },
                { profileId: p.duplicateMatchedProfileId },
              ],
            },
            include: {
              user: {
                select: {
                  fullName: true,
                  mobile: true,
                },
              },
            },
          });
        }

        return {
          id: p.id,
          profileId: p.profileId,
          legacyProfileId: p.legacyProfileId,
          name: `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.user?.fullName,
          gender: p.user?.gender || "NOT_SPECIFIED",
          mobile: p.user?.mobile,
          maskedMobile: maskMobileNumber(p.user?.mobile || ""),
          source: p.source,
          approvalStatus: p.approvalStatus,
          paymentCompleted: p.paymentCompleted,
          isVisible: p.isVisible,
          duplicateNotes: p.duplicateNotes || "Multi-signal identity similarity flagged for admin review",
          createdAt: p.createdAt,
          matchedProfile: matchedProfile
            ? {
                profileId: matchedProfile.profileId,
                legacyProfileId: matchedProfile.legacyProfileId,
                name: `${matchedProfile.firstName || ""} ${matchedProfile.lastName || ""}`.trim() || matchedProfile.user?.fullName,
                maskedMobile: maskMobileNumber(matchedProfile.user?.mobile || ""),
                createdAt: matchedProfile.createdAt,
              }
            : null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      duplicates: enriched,
      totalCount: enriched.length,
    });
  } catch (error: any) {
    console.error("ADMIN DUPLICATES GET ERROR:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch duplicate flags." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { profileId } = body;

    if (!profileId) {
      return NextResponse.json(
        { success: false, message: "Profile ID is required." },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.findFirst({
      where: {
        OR: [{ id: profileId }, { profileId: profileId }],
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profile not found." },
        { status: 404 }
      );
    }

    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        isDuplicateFlagged: false,
        duplicateNotes: `Duplicate flag reviewed and cleared by admin on ${new Date().toLocaleString("en-IN")}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Duplicate flag on Profile ${profile.profileId} has been resolved successfully.`,
    });
  } catch (error: any) {
    console.error("ADMIN RESOLVE DUPLICATE ERROR:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to resolve duplicate flag." },
      { status: 500 }
    );
  }
}
