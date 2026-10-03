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

    const whereClause: any = {
      isVisible: true,
      OR: [
        { paymentCompleted: true },
        { approvalStatus: "APPROVED" },
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

    const [total, profiles] = await Promise.all([
      prisma.profile.count({ where: whereClause }),
      prisma.profile.findMany({
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
        select: {
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
        },
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