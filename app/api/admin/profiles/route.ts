import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "";
    const source = searchParams.get("source") || "";
    const payment = searchParams.get("payment") || "";
    const visibilityParam = (searchParams.get("visibility") || "").trim().toUpperCase();
    const hiddenParam = (searchParams.get("hidden") || "").trim().toLowerCase();
    const duplicate = searchParams.get("duplicate") || "";
    const gender = (searchParams.get("gender") || "").trim().toUpperCase();

    const whereClause: any = {};
    const andConditions: any[] = [];

    if (status) {
      whereClause.approvalStatus = status;
    }

    if (gender === "MALE" || gender === "FEMALE") {
      whereClause.user = {
        ...whereClause.user,
        gender: gender,
      };
    }

    if (source === "GOOGLE_FORM") {
      whereClause.source = "GOOGLE_FORM";
    } else if (source === "WEBSITE") {
      andConditions.push({
        OR: [{ source: null }, { source: "DIRECT" }, { source: "WEBSITE" }],
      });
    }

    if (payment === "PAID") {
      whereClause.paymentCompleted = true;
    } else if (payment === "PENDING") {
      whereClause.paymentCompleted = false;
    }

    if (
      visibilityParam === "HIDDEN" ||
      visibilityParam === "HIDE" ||
      visibilityParam === "FALSE" ||
      hiddenParam === "true" ||
      hiddenParam === "1"
    ) {
      whereClause.isVisible = false;
    } else if (
      visibilityParam === "LIVE" ||
      visibilityParam === "VISIBLE" ||
      visibilityParam === "TRUE" ||
      hiddenParam === "false" ||
      hiddenParam === "0"
    ) {
      whereClause.isVisible = true;
    }

    if (duplicate === "FLAGGED") {
      whereClause.isDuplicateFlagged = true;
    }

    if (search) {
      andConditions.push({
        OR: [
          {
            profileId: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            legacyProfileId: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            firstName: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            lastName: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            user: {
              mobile: {
                contains: search,
              },
            },
          },
          {
            user: {
              fullName: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        ],
      });
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    const profiles = await prisma.profile.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            mobile: true,
            gender: true,
            status: true,
            email: true,
            payments: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                id: true,
                status: true,
                grossAmount: true,
                invoiceNumber: true,
                paymentDate: true,
                createdAt: true,
              },
            },
          },
        },
        occupation: {
          select: {
            profession: true,
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
      count: profiles.length,
      profiles,
    });
  } catch (error) {
    console.error("ADMIN PROFILES API ERROR =>", error);

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
