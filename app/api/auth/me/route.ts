import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, AUTH_COOKIE_MAX_AGE } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    const cookieToken = req.cookies.get("nnvs_token")?.value;
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7).trim()
      : null;
    const headerToken = req.headers.get("x-nnvs-token");

    const token = cookieToken || bearerToken || headerToken;

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
      token,
      maxAge: AUTH_COOKIE_MAX_AGE,
      user: {
        ...user,
        activeProfile,
        profile: activeProfile,
        profiles: formattedProfiles,
      },
    });

    // If request authenticated via header but cookie was missing, re-hydrate cookie
    if (!cookieToken && token) {
      response.cookies.set("nnvs_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: AUTH_COOKIE_MAX_AGE,
      });
    }

    if (activeProfile && (!cookieActiveId || cookieActiveId !== activeProfile.id)) {
      response.cookies.set("activeProfileId", activeProfile.id, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: AUTH_COOKIE_MAX_AGE,
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