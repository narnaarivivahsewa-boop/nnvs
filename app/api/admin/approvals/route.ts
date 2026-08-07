import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const profiles = await prisma.profile.findMany({
      where: {
        approvalStatus: "UNDER_REVIEW",
      },

      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            mobile: true,
            gender: true,
          },
        },

        family: true,
        education: true,
        occupation: true,
      },

      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      count: profiles.length,
      profiles,
    });

  } catch (error: any) {

    console.error(
      "APPROVAL API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to fetch profiles.",
      },
      {
        status: 500,
      }
    );

  }
}