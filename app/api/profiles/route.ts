import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    // ===========================
    // Verify Login
    // ===========================

    const token = req.cookies.get("nnvs_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const payload = await verifyToken(token);

    // ===========================
    // Fetch Profiles
    // ===========================

    const profiles = await prisma.profile.findMany({
      where: {
        isVisible: true,

        userId: {
          not: payload.userId,
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      include: {
        user: {
          select: {
            fullName: true,
            gender: true,
          },
        },

        photos: {
          where: {
            isPrimary: true,
          },
          take: 1,
        },

        occupation: true,
      },
    });

    return NextResponse.json({
      success: true,
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
      {
        status: 500,
      }
    );
  }
}