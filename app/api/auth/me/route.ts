import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyRequestSession,
  isSecureCookieRequest,
  sanitizeProfilePhotoUrl,
  AUTH_COOKIE_MAX_AGE,
} from "@/lib/jwt";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, no-cache, must-revalidate",
  Vary: "Cookie, Authorization",
};

function clearAuthCookies(res: NextResponse, secureCookie: boolean) {
  res.cookies.set("nnvs_token", "", {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  res.cookies.set("activeProfileId", "", {
    httpOnly: false,
    secure: secureCookie,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function GET(req: NextRequest) {
  const secureCookie = isSecureCookieRequest(req);

  try {
    const { session, token, cookieToken, cookieWasInvalid } =
      await verifyRequestSession(req);

    if (!session || !token) {
      const res = NextResponse.json(
        {
          success: false,
          message: cookieWasInvalid
            ? "Session expired. Please sign in again."
            : "Not authenticated.",
        },
        { status: 401, headers: NO_STORE_HEADERS }
      );
      if (cookieToken || cookieWasInvalid) {
        clearAuthCookies(res, secureCookie);
      }
      return res;
    }

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
              orderBy: { isPrimary: "desc" },
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
      const res = NextResponse.json(
        {
          success: false,
          message: "User account not found.",
        },
        { status: 404, headers: NO_STORE_HEADERS }
      );
      if (cookieToken) {
        clearAuthCookies(res, secureCookie);
      }
      return res;
    }

    if (
      user.role !== "ADMIN" &&
      (user.status === "BLOCKED" || user.status === "DELETED")
    ) {
      const res = NextResponse.json(
        {
          success: false,
          message: "Your account is currently suspended.",
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
      clearAuthCookies(res, secureCookie);
      return res;
    }

    const cookieActiveId = req.cookies.get("activeProfileId")?.value;
    const targetActiveId = cookieActiveId || session.activeProfileId;

    const formattedProfiles = (user.profiles || []).map((p: any) => {
      const sanitizedPhoto = sanitizeProfilePhotoUrl(
        p.photos?.[0]?.imageUrl,
        p.profileId
      );
      return {
        ...p,
        gender: p.user?.gender || user.gender || null,
        photo: sanitizedPhoto,
        photos:
          p.photos?.length > 0 && sanitizedPhoto
            ? [
                {
                  id: p.photos[0].id,
                  isPrimary: p.photos[0].isPrimary,
                  imageUrl: sanitizedPhoto,
                },
              ]
            : [],
      };
    });

    let activeProfile = null;
    if (formattedProfiles.length > 0) {
      if (targetActiveId) {
        activeProfile =
          formattedProfiles.find(
            (p: any) => p.id === targetActiveId || p.profileId === targetActiveId
          ) || null;
      }
      if (!activeProfile) {
        activeProfile = formattedProfiles[0];
      }
    }

    const response = NextResponse.json(
      {
        success: true,
        token,
        maxAge: AUTH_COOKIE_MAX_AGE,
        user: {
          ...user,
          activeProfile,
          profile: activeProfile,
          profiles: formattedProfiles,
        },
      },
      { headers: NO_STORE_HEADERS }
    );

    // Re-hydrate HttpOnly cookie if authenticated via Bearer/header or if cookie was stale
    if ((!cookieToken || cookieWasInvalid) && token) {
      response.cookies.set("nnvs_token", token, {
        httpOnly: true,
        secure: secureCookie,
        sameSite: "lax",
        path: "/",
        maxAge: AUTH_COOKIE_MAX_AGE,
      });
    }

    if (activeProfile && (!cookieActiveId || cookieActiveId !== activeProfile.id)) {
      response.cookies.set("activeProfileId", activeProfile.id, {
        httpOnly: false,
        secure: secureCookie,
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
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
