import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function getDobRangeForAgeGroup(ageGroup: string): { gte?: Date; lte?: Date } | null {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();

  const yearsAgo = (yrs: number) => new Date(Date.UTC(year - yrs, month, day, 23, 59, 59, 999));

  switch (ageGroup) {
    case "18-24":
      return { gte: yearsAgo(25), lte: yearsAgo(18) };
    case "25-30":
      return { gte: yearsAgo(31), lte: yearsAgo(25) };
    case "31-35":
      return { gte: yearsAgo(36), lte: yearsAgo(31) };
    case "36-40":
      return { gte: yearsAgo(41), lte: yearsAgo(36) };
    case "41-50":
      return { gte: yearsAgo(51), lte: yearsAgo(41) };
    case "51+":
      return { lte: yearsAgo(51) };
    default:
      return null;
  }
}

const publicProfileSelect = {
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
      // Strictly NO mobile, email, or sensitive contact info
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
    take: 1,
    select: {
      imageUrl: true,
      isPrimary: true,
    },
  },
} satisfies Prisma.ProfileSelect;

type SelectedPublicProfile = Prisma.ProfileGetPayload<{
  select: typeof publicProfileSelect;
}>;

function formatPublicProfileCard(profile: SelectedPublicProfile) {
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
    const { searchParams } = new URL(req.url);

    // Query parameters
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const gender = searchParams.get("gender");
    const religion = searchParams.get("religion");
    const caste = searchParams.get("caste");
    const query = searchParams.get("q");
    const ageGroup = searchParams.get("age");
    const city = searchParams.get("city");
    const maritalStatus = searchParams.get("maritalStatus");
    const profession = searchParams.get("profession");

    const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
    // Allow custom limit, default to 24 per page for clean grid (2x, 3x, 4x compatible)
    const limit =
      limitParam === "all"
        ? 100
        : Math.min(100, Math.max(1, parseInt(limitParam || "24", 10) || 24));
    const skip = (page - 1) * limit;

    // STRICT VISIBILITY GATE:
    // A profile can ONLY be visible if APPROVED AND (paymentCompleted OR isPaymentExempted)
    const andConditions: Prisma.ProfileWhereInput[] = [];

    if (gender && (gender.toUpperCase() === "MALE" || gender.toUpperCase() === "FEMALE")) {
      andConditions.push({
        user: {
          gender: gender.toUpperCase() as "MALE" | "FEMALE",
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

    if (ageGroup) {
      const dobRange = getDobRangeForAgeGroup(ageGroup);
      if (dobRange) {
        andConditions.push({
          dateOfBirth: dobRange,
        });
      }
    }

    if (city && city.trim()) {
      andConditions.push({
        birthPlace: {
          contains: city.trim(),
          mode: "insensitive",
        },
      });
    }

    if (maritalStatus && maritalStatus !== "All") {
      andConditions.push({
        maritalStatus: {
          equals: maritalStatus.trim(),
          mode: "insensitive",
        },
      });
    }

    if (profession && profession.trim()) {
      andConditions.push({
        occupation: {
          profession: {
            contains: profession.trim(),
            mode: "insensitive",
          },
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
          { birthPlace: { contains: q, mode: "insensitive" } },
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
      ...(andConditions.length > 0 ? { AND: andConditions } : {}),
    };

    const isFeatured = searchParams.get("featured") === "true";
    const sort = searchParams.get("sort") || "";

    // DYNAMIC & FEMALE-FIRST FEATURED ROTATION:
    // When featured=true or sort=female-first (and no explicit gender filter was passed), prioritize female (Bride) profiles at the top
    // with dynamic rotation from recently approved/registered candidates.
    const hasExplicitGenderFilter = Boolean(
      gender && (gender.toUpperCase() === "MALE" || gender.toUpperCase() === "FEMALE")
    );
    if (!hasExplicitGenderFilter && (isFeatured || sort === "female-first")) {
      const poolTake = Math.max(limit * 3, 24);

      const [total, femalePool, malePool] = await Promise.all([
        prisma.profile.count({ where: whereClause }),
        prisma.profile.findMany({
          where: {
            ...whereClause,
            user: { gender: "FEMALE" },
          },
          orderBy: { createdAt: "desc" },
          take: poolTake,
          select: publicProfileSelect,
        }),
        prisma.profile.findMany({
          where: {
            ...whereClause,
            user: { gender: "MALE" },
          },
          orderBy: { createdAt: "desc" },
          take: poolTake,
          select: publicProfileSelect,
        }),
      ]);

      function shuffle<T>(arr: T[]): T[] {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      }

      // Allocate primary prominence to Brides (approx 67% female, rest male)
      const femaleQuota = Math.min(femalePool.length, Math.ceil(limit * 0.67));
      const maleQuota = limit - femaleQuota;

      const selectedFemales = shuffle(femalePool).slice(0, femaleQuota);
      const selectedMales = shuffle(malePool).slice(0, maleQuota);

      let combined = [...selectedFemales, ...selectedMales];
      if (combined.length < limit) {
        const existingIds = new Set(combined.map((p) => p.id));
        const remainingFemales = femalePool.filter((p) => !existingIds.has(p.id));
        const remainingMales = malePool.filter((p) => !existingIds.has(p.id));
        const backfill = [...remainingFemales, ...remainingMales].slice(0, limit - combined.length);
        combined = [...combined, ...backfill];
      }

      return NextResponse.json(
        {
          success: true,
          total,
          page: 1,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore: false,
          profiles: combined.map(formatPublicProfileCard),
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    }

    const [total, profiles] = await Promise.all([
      prisma.profile.count({ where: whereClause }),
      prisma.profile.findMany({
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
        select: publicProfileSelect,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
        profiles: profiles.map(formatPublicProfileCard),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("PUBLIC PROFILES API ERROR =>", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load profiles.",
      },
      {
        status: 500,
      }
    );
  }
}