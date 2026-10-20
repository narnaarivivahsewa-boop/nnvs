import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { Gender } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const genderParam = searchParams.get("gender")?.toUpperCase();
    const q = (searchParams.get("q") || "").trim();
    const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10), 60);

    const where: any = {};

    // Filter by gender if specified
    if (genderParam === "MALE" || genderParam === "FEMALE") {
      where.user = {
        gender: genderParam as Gender,
      };
    }

    // Keyword search across Name, Mobile, Registration ID, Legacy ID
    if (q) {
      const isDigitsOnly = /^\d+$/.test(q);
      const searchConditions: any[] = [
        { profileId: { contains: q, mode: "insensitive" } },
        { legacyProfileId: { contains: q, mode: "insensitive" } },
        { oldNnvsId: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { birthPlace: { contains: q, mode: "insensitive" } },
        { caste: { contains: q, mode: "insensitive" } },
        {
          user: {
            is: {
              ...(where.user?.gender ? { gender: where.user.gender } : {}),
              OR: [
                { fullName: { contains: q, mode: "insensitive" } },
                { mobile: { contains: q } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        },
      ];

      // If user typed full name "Rahul Sharma", match both parts
      const parts = q.split(/\s+/).filter(Boolean);
      if (parts.length > 1) {
        searchConditions.push({
          AND: [
            { firstName: { contains: parts[0], mode: "insensitive" } },
            { lastName: { contains: parts[1], mode: "insensitive" } },
          ],
        });
      }

      where.OR = searchConditions;
    }

    const profiles = await prisma.profile.findMany({
      where,
      take: limit,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        profileId: true,
        legacyProfileId: true,
        oldNnvsId: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        birthTime: true,
        birthPlace: true,
        manglik: true,
        caste: true,
        religion: true,
        motherTongue: true,
        maritalStatus: true,
        paymentCompleted: true,
        isPaymentExempted: true,
        approvalStatus: true,
        user: {
          select: {
            id: true,
            fullName: true,
            mobile: true,
            gender: true,
            email: true,
          },
        },
        photos: {
          orderBy: { isPrimary: "desc" },
          take: 1,
          select: {
            imageUrl: true,
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
      },
    });

    const results = profiles.map((p) => {
      const fullName =
        [p.firstName, p.lastName].filter(Boolean).join(" ").trim() ||
        p.user?.fullName ||
        p.profileId;

      return {
        id: p.id,
        profileId: p.profileId,
        legacyProfileId: p.legacyProfileId,
        displayId: p.legacyProfileId || p.profileId,
        fullName,
        gender: p.user?.gender || (genderParam as Gender) || "MALE",
        mobile: p.user?.mobile || "",
        email: p.user?.email || "",
        dateOfBirth: p.dateOfBirth ? p.dateOfBirth.toISOString().split("T")[0] : null,
        birthTime: p.birthTime || null,
        birthPlace: p.birthPlace || "",
        manglik: p.manglik || "No",
        caste: p.caste || "",
        religion: p.religion || "",
        motherTongue: p.motherTongue || "",
        maritalStatus: p.maritalStatus || "Never Married",
        education: p.education?.highestQualification || "",
        occupation: p.occupation?.profession || "",
        photo: p.photos?.[0]?.imageUrl || null,
        paymentCompleted: p.paymentCompleted || p.isPaymentExempted,
        approvalStatus: p.approvalStatus,
      };
    });

    return NextResponse.json({
      success: true,
      count: results.length,
      profiles: results,
    });
  } catch (error: any) {
    console.error("[Admin Kundali Search Error]:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to search profiles" },
      { status: 500 }
    );
  }
}
