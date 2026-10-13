import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("nnvs_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    const session = await verifyToken(token);

    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      select: {
        id: true,
        fullName: true,
        mobile: true,
        email: true,
        gender: true,
        role: true,
        status: true,
        mobileVerified: true,
        mustChangePassword: true,

        profiles: {
          select: {
            id: true,
            profileId: true,
            oldNnvsId: true,
            legacyProfileId: true,
            profileCompletion: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            birthPlace: true,
            birthTime: true,
            manglik: true,
            height: true,
            maritalStatus: true,
            religion: true,
            caste: true,
            motherTongue: true,
            isVisible: true,
            paymentCompleted: true,
            isPaymentExempted: true,
            paymentExemptionReason: true,
            approvalStatus: true,
            approvedAt: true,
            photos: {
              select: {
                id: true,
                imageUrl: true,
                isPrimary: true,
              },
              take: 1,
            },
            user: {
              select: {
                gender: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User account not found.",
        },
        { status: 404 }
      );
    }

    const cookieActiveId = req.cookies.get("activeProfileId")?.value;
    const targetActiveId = cookieActiveId || session.activeProfileId;

    const formattedProfiles = (user.profiles || []).map((p: any) => ({
      ...p,
      gender: p.user?.gender || user.gender || null,
      photo: p.photos?.[0]?.imageUrl || null,
    }));

    let activeProfile = null;
    if (formattedProfiles.length > 0) {
      if (targetActiveId) {
        activeProfile = formattedProfiles.find(
          (p: any) => p.id === targetActiveId || p.profileId === targetActiveId
        ) || null;
      }
      if (!activeProfile) {
        activeProfile = formattedProfiles[0];
      }
    }

    const response = NextResponse.json({
      success: true,
      user: {
        ...user,
        activeProfile,
        profile: activeProfile,
        profiles: formattedProfiles,
      },
    });

    if (activeProfile && (!cookieActiveId || cookieActiveId !== activeProfile.id)) {
      response.cookies.set("activeProfileId", activeProfile.id, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (error) {
    console.error("AUTH ME ERROR =>", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}