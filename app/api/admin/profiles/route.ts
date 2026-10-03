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
    const visibility = searchParams.get("visibility") || "";
    const duplicate = searchParams.get("duplicate") || "";

    const whereClause: any = {};

    if (status) {
      whereClause.approvalStatus = status;
    }

    if (source === "GOOGLE_FORM") {
      whereClause.source = "GOOGLE_FORM";
    } else if (source === "WEBSITE") {
      whereClause.OR = [{ source: null }, { source: "DIRECT" }, { source: "WEBSITE" }];
    }

    if (payment === "PAID") {
      whereClause.paymentCompleted = true;
    } else if (payment === "PENDING") {
      whereClause.paymentCompleted = false;
    }

    if (visibility === "LIVE") {
      whereClause.isVisible = true;
    } else if (visibility === "HIDDEN") {
      whereClause.isVisible = false;
    }

    if (duplicate === "FLAGGED") {
      whereClause.isDuplicateFlagged = true;
    }

    if (search) {
      whereClause.OR = [
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
      ];
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
            },
          },
        },
        occupation: true,
        photos: {
          where: {
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
  } catch (error: any) {
    console.error("ADMIN PROFILES API ERROR =>", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}
