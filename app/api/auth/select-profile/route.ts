import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateToken,
  verifyRequestSession,
  isSecureCookieRequest,
  sanitizeProfilePhotoUrl,
  AUTH_COOKIE_MAX_AGE,
} from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { session } = await verifyRequestSession(req);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }
    const body = await req.json().catch(() => ({}));
    const profileId = String(body.profileId || "").trim();

    if (!profileId) {
      return NextResponse.json(
        { success: false, message: "profileId is required." },
        { status: 400 }
      );
    }

    // Verify user owns this profile
    const profile = await prisma.profile.findFirst({
      where: {
        userId: session.userId,
        OR: [{ id: profileId }, { profileId: profileId }],
      },
      select: {
        id: true,
        profileId: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        paymentCompleted: true,
        approvalStatus: true,
        photos: {
          select: { imageUrl: true, isPrimary: true },
          orderBy: { isPrimary: "desc" },
          take: 1,
        },
        user: {
          select: { gender: true, fullName: true },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message: "Profile not found or does not belong to your account.",
        },
        { status: 404 }
      );
    }

    // Generate updated JWT carrying activeProfileId
    const updatedToken = await generateToken(
      session.userId,
      session.mobile,
      session.role,
      profile.id
    );

    const formattedProfile = {
      id: profile.id,
      profileId: profile.profileId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      gender: profile.user?.gender || null,
      photo: sanitizeProfilePhotoUrl(profile.photos?.[0]?.imageUrl, profile.profileId),
      dateOfBirth: profile.dateOfBirth,
      paymentCompleted: profile.paymentCompleted,
      approvalStatus: profile.approvalStatus,
    };

    const redirectTo = !profile.paymentCompleted
      ? `/payment?profileId=${encodeURIComponent(profile.profileId)}&name=${encodeURIComponent(
          profile.user?.fullName || ""
        )}&gender=${encodeURIComponent(profile.user?.gender || "")}`
      : "/dashboard";

    const response = NextResponse.json(
      {
        success: true,
        message: `Switched active profile to ${profile.firstName || profile.profileId}.`,
        token: updatedToken,
        maxAge: AUTH_COOKIE_MAX_AGE,
        activeProfileId: profile.id,
        activeProfile: formattedProfile,
        redirectTo,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, no-cache, must-revalidate",
        },
      }
    );

    const secureCookie = isSecureCookieRequest(req);

    response.cookies.set("activeProfileId", profile.id, {
      httpOnly: false,
      secure: secureCookie,
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE,
    });

    response.cookies.set("nnvs_token", updatedToken, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("SELECT PROFILE ERROR =>", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
