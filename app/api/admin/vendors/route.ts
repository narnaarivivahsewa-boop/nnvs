import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            mobile: true,
            email: true,
            status: true,
          },
        },
        galleries: true,
        reviews: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      vendors,
    });
  } catch (error) {
    console.error("VENDORS API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch vendors.",
      },
      {
        status: 500,
      }
    );
  }
}