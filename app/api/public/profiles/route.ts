import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
    // Allow custom limit, default to 24 per page for clean grid (2x, 3x, 4x compatible)
    const limit = limitParam === "all" ? 1000 : Math.min(100, Math.max(1, parseInt(limitParam || "24", 10) || 24));
    const skip = (page - 1) * limit;

    // STRICT VISIBILITY GATE:
    // A profile can ONLY be visible if APPROVED AND (paymentCompleted OR isPaymentExempted)
    const whereClause: any = {
      isVisible: true,
      approvalStatus: "APPROVED",
      OR: [
        { paymentCompleted: true },
        { isPaymentExempted: true },
      ],
    };

    if (gender && (gender.toUpperCase() === "MALE" || gender.toUpperCase() === "FEMALE")) {
      whereClause.user = {
        gender: gender.toUpperCase(),
      };
    }

    if (religion && religion !== "All") {
      whereClause.religion = {
        equals: religion,
        mode: "insensitive",
      };
    }

    if (caste && !caste.startsWith("All ") && caste !== "Other / Open to All") {
      const cleanCaste = caste.replace(" (all)", "").trim();
      whereClause.caste = {
        contains: cleanCaste,
        mode: "insensitive",
      };
    }

    if (query && query.trim()) {
      const q = query.trim();
      whereClause.AND = [
        {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { profileId: { contains: q, mode: "insensitive" } },
            { legacyProfileId: { contains: q, mode: "insensitive" } },
            { caste: { contains: q, mode: "insensitive" } },
            { user: { fullName: { contains: q, mode: "insensitive" } } },
          ],
        },
      ];
    }

    const isFeatured = searchParams.get("featured") === "true";
    const sort = searchParams.get("sort") || "";

    const profileSelect = {
      id: true,
      profileId: true,
      legacyProfileId: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      height: true,
      maritalStatus: true,
      religion: true,
      caste: true,
      motherTongue: true,
      birthPlace: true,
      diet: true,
      manglik: true,
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
          occupationField: true,
        },
      },
      occupation: {
        select: {
          profession: true,
          company: true,
          annualIncome: true,
        },
      },
      photos: {
        where: {
          isPrimary: true,
        },
        take: 1,
        select: {
          imageUrl: true,
          isPrimary: true,
        },
      },
    };

    // DYNAMIC & FEMALE-FIRST FEATURED ROTATION:
    // When featured=true or sort=female-first, prioritize female (Bride) profiles at the top
    // with dynamic rotation from recently approved/registered candidates.
    if (isFeatured || sort === "female-first") {
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
          select: profileSelect,
        }),
        prisma.profile.findMany({
          where: {
            ...whereClause,
            user: { gender: "MALE" },
          },
          orderBy: { createdAt: "desc" },
          take: poolTake,
          select: profileSelect,
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
          profiles: combined,
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
        select: profileSelect,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
      profiles,
    });
  } catch (error) {
    console.error("PUBLIC PROFILES API ERROR =>", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}