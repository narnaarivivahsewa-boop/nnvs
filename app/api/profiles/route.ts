import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyRequestSession } from "@/lib/jwt";
import { getActiveProfileForUser } from "@/lib/auth/active-profile";

const authenticatedProfileSelect = {
  id: true,
  profileId: true,
  legacyProfileId: true,
  dateOfBirth: true,
  height: true,
  maritalStatus: true,
  religion: true,
  caste: true,
  birthPlace: true,
  user: {
    select: {
      fullName: true,
      gender: true,
      // Notice: mobile & email NOT exposed in directory listing for privacy
    },
  },
  education: {
    select: {
      highestQualification: true,
    },
  },
  occupation: {
    select: {
      profession: true,
    },
  },
  _count: {
    select: {
      photos: true,
    },
  },
  photos: {
    where: {
      NOT: {
        imageUrl: {
          startsWith: "data:",
        },
      },
    },
    orderBy: {
      isPrimary: "desc" as const,
    },
    select: {
      imageUrl: true,
      isPrimary: true,
    },
    take: 1,
  },
} satisfies Prisma.ProfileSelect;

type SelectedAuthenticatedProfile = Prisma.ProfileGetPayload<{
  select: typeof authenticatedProfileSelect;
}>;

function formatAuthenticatedProfileCard(profile: SelectedAuthenticatedProfile) {
  const externalPhoto = profile.photos?.[0]?.imageUrl?.trim() || null;
  const hasAnyPhoto = (profile._count?.photos ?? 0) > 0;
  const resolvedPhotoUrl =
    externalPhoto || (hasAnyPhoto ? `/api/profiles/${encodeURIComponent(profile.profileId)}/photo` : null);

  return {
    id: profile.id,
    profileId: profile.profileId,
    legacyProfileId: profile.legacyProfileId,
    dateOfBirth: profile.dateOfBirth,
    height: profile.height,
    maritalStatus: profile.maritalStatus,
    religion: profile.religion,
    caste: profile.caste,
    birthPlace: profile.birthPlace,
    user: profile.user,
    education: profile.education,
    occupation: profile.occupation,
    isVerified: true,
    photoUrl: resolvedPhotoUrl,
    photos: resolvedPhotoUrl ? [{ imageUrl: resolvedPhotoUrl, isPrimary: true }] : [],
  };
}

export async function GET(req: NextRequest) {
  try {
    // ===========================
    // Verify Login Authentication
    // ===========================
    const { session: payload, cookieWasInvalid } = await verifyRequestSession(req);

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: cookieWasInvalid
            ? "Session expired. Please login again."
            : "Please login with your registered mobile number using OTP to view matrimonial profiles.",
        },
        { status: 401 }
      );
    }

    // Get current user and active profile to determine matching requirements
    const [currentUser, activeProfile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, gender: true, role: true },
      }),
      getActiveProfileForUser(req, payload.userId, payload.activeProfileId, {
        select: { id: true, user: { select: { gender: true } } },
      }),
    ]);

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: "User account not found.",
        },
        { status: 401 }
      );
    }

    const effectiveGender = activeProfile?.user?.gender || currentUser.gender;

    const { searchParams } = new URL(req.url);
    if (searchParams.get("metaOnly") === "1") {
      return NextResponse.json(
        {
          success: true,
          authenticated: true,
          userGender: effectiveGender,
        },
        {
          headers: {
            "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
            Vary: "Cookie, Authorization",
          },
        }
      );
    }

    // Gender-based matching rule:
    // Male user / active profile -> Female profiles
    // Female user / active profile -> Male profiles
    // Admin -> All profiles
    let targetGender: "MALE" | "FEMALE" | undefined = undefined;
    if (currentUser.role !== "ADMIN") {
      if (effectiveGender === "MALE") {
        targetGender = "FEMALE";
      } else if (effectiveGender === "FEMALE") {
        targetGender = "MALE";
      }
    }

    // Query parameters
    const religion = searchParams.get("religion");
    const caste = searchParams.get("caste");
    const query = searchParams.get("q");
    const rawPage = Number(searchParams.get("page"));
    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
    const rawLimit = Number(searchParams.get("limit"));
    const take = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 100) : 24;
    const skip = (page - 1) * take;

    const andConditions: Prisma.ProfileWhereInput[] = [];

    if (targetGender) {
      andConditions.push({
        user: {
          gender: targetGender,
        },
      });
    }

    if (religion && religion !== "All") {
      andConditions.push({
        religion: {
          equals: religion,
          mode: "insensitive",
        },
      });
    }

    if (caste && !caste.startsWith("All ") && caste !== "Other / Open to All") {
      const cleanCaste = caste.replace(" (all)", "").trim();
      andConditions.push({
        caste: {
          contains: cleanCaste,
          mode: "insensitive",
        },
      });
    }

    if (query && query.trim()) {
      const q = query.trim();
      andConditions.push({
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { profileId: { contains: q, mode: "insensitive" } },
          { legacyProfileId: { contains: q, mode: "insensitive" } },
          { caste: { contains: q, mode: "insensitive" } },
          { user: { fullName: { contains: q, mode: "insensitive" } } },
        ],
      });
    }

    const whereClause: Prisma.ProfileWhereInput = {
      isVisible: true,
      approvalStatus: "APPROVED",
      OR: [
        { paymentCompleted: true },
        { isPaymentExempted: true },
      ],
      userId: {
        not: currentUser.id, // Exclude own profile
      },
      ...(andConditions.length > 0 ? { AND: andConditions } : {}),
    };

    const [total, profiles] = await Promise.all([
      prisma.profile.count({ where: whereClause }),
      prisma.profile.findMany({
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take,
        select: authenticatedProfileSelect,
      }),
    ]);

    const totalPages = Math.ceil(total / take);
    const formatted = profiles.map(formatAuthenticatedProfileCard);

    return NextResponse.json(
      {
        success: true,
        authenticated: true,
        userGender: effectiveGender,
        total,
        page,
        limit: take,
        totalPages,
        hasMore: page < totalPages,
        count: formatted.length,
        profiles: formatted,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
          Vary: "Cookie, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("PROFILES API ERROR =>", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}