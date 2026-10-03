import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const profiles = await prisma.profile.findMany({
      where: {
        isVisible: true,
        OR: [
          { paymentCompleted: true },
          { approvalStatus: "APPROVED" },
        ],
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 6,

      include: {
        user: {
          select: {
            fullName: true,
            gender: true,
          },
        },

        education: true,

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