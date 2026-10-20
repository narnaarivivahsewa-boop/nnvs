import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = Math.min(24, Math.max(1, parseInt(limitParam || "6", 10) || 6));

    // STRICT VISIBILITY & APPROVAL GATE
    const whereClause: any = {
      isVisible: true,
      approvalStatus: "APPROVED",
      OR: [
        { paymentCompleted: true },
        { isPaymentExempted: true },
      ],
    };

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
        limit,
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
  } catch (error) {
    console.error("FEATURED PROFILES API ERROR =>", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
