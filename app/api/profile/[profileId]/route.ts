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
    let userPayload: any = null;
    const token = req.cookies.get("nnvs_token")?.value;

    if (token) {
      try {
        const payload = await verifyToken(token);
        if (payload?.userId) {
          isAuthenticated = true;
          userPayload = payload;
        }
      } catch {
        isAuthenticated = false;
      }
    }

    const profile = await prisma.profile.findFirst({
      where: {
        OR: [{ profileId }, { id: profileId }, { legacyProfileId: profileId }],
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

    // Strict Gate: Only Paid & Approved profiles are publicly accessible.
    // Unpaid or draft profiles can only be viewed by their owner or an Admin.
    const isOwner = userPayload?.userId === profile.userId;
    const isAdmin = userPayload?.role === "ADMIN";
    const isPaid = profile.paymentCompleted || profile.isPaymentExempted;
    const isPubliclyViewable = profile.isVisible && profile.approvalStatus === "APPROVED" && isPaid;

    if (!isPubliclyViewable && !isOwner && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "This profile is currently in draft status or pending verification.",
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