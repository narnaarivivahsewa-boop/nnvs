import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    // ===========================
    // Verify Login Authentication
    // ===========================
    const token = req.cookies.get("nnvs_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: "Please login with your registered mobile number using OTP to view matrimonial profiles.",
        },
        { status: 401 }
      );
    }

    let payload: any;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: "Session expired. Please login again.",
        },
        { status: 401 }
      );
    }

    // Get current user to determine matching requirements
    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, gender: true, role: true },
    });

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

    // Gender-based matching rule:
    // Male user -> Female profiles
    // Female user -> Male profiles
    // Admin -> All profiles
    let targetGender: "MALE" | "FEMALE" | undefined = undefined;
    if (currentUser.role !== "ADMIN") {
      if (currentUser.gender === "MALE") {
        targetGender = "FEMALE";
      } else if (currentUser.gender === "FEMALE") {
        targetGender = "MALE";
      }
    }

    // Query parameters
    const { searchParams } = new URL(req.url);
    const religion = searchParams.get("religion");
    const caste = searchParams.get("caste");
    const query = searchParams.get("q");

    const whereClause: any = {
      isVisible: true,
      OR: [
        { paymentCompleted: true },
        { approvalStatus: "APPROVED" },
      ],
      userId: {
        not: currentUser.id, // Exclude own profile
      },
    };

    if (targetGender) {
      whereClause.user = {
        gender: targetGender,
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

    const profiles = await prisma.profile.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
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
            // Notice: mobile & email NOT exposed in directory listing for privacy
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
          select: {
            imageUrl: true,
            isPrimary: true,
          },
          take: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      authenticated: true,
      userGender: currentUser.gender,
      count: profiles.length,
      profiles,
    });
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