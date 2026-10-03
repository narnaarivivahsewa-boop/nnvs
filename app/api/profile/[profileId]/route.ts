import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{ profileId: string }>;
  }
) {
  try {
    const { profileId } = await context.params;

    // Check optional authentication token
    let isAuthenticated = false;
    const token = req.cookies.get("nnvs_token")?.value;

    if (token) {
      try {
        const payload = await verifyToken(token);
        if (payload?.userId) {
          isAuthenticated = true;
        }
      } catch {
        isAuthenticated = false;
      }
    }

    const profile = await prisma.profile.findUnique({
      where: {
        profileId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            gender: true,
            mobile: true,
            email: true,
          },
        },
        photos: {
          orderBy: {
            isPrimary: "desc",
          },
        },
        family: true,
        education: true,
        occupation: true,
        partnerPreference: true,
        phoneNumbers: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message: "Profile not found.",
        },
        { status: 404 }
      );
    }

    // Protect contact details:
    // If not authenticated, strip mobile, email, and phoneNumbers
    const sanitizedUser = {
      fullName: profile.user.fullName,
      gender: profile.user.gender,
      mobile: isAuthenticated ? profile.user.mobile : null,
      email: isAuthenticated ? profile.user.email : null,
    };

    const sanitizedPhoneNumbers = isAuthenticated
      ? profile.phoneNumbers
      : [];

    const sanitizedProfile = {
      ...profile,
      user: sanitizedUser,
      phoneNumbers: sanitizedPhoneNumbers,
      isContactUnlocked: isAuthenticated,
    };

    return NextResponse.json({
      success: true,
      isAuthenticated,
      profile: sanitizedProfile,
    });
  } catch (error) {
    console.error("PROFILE DETAILS API ERROR =>", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}