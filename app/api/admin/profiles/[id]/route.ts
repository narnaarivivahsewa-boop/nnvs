import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await context.params;

    const profile = await prisma.profile.findUnique({
      where: {
        id,
      },

      include: {
        user: {
          select: {
            fullName: true,
            mobile: true,
            email: true,
            gender: true,
            status: true,
            mobileVerified: true,
            emailVerified: true,
            createdAt: true,
          },
        },

        photos: {
          orderBy: {
            isPrimary: "desc",
          },
        },

        family: true,

        education: true,

        occupation: true,

        partnerPreference: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message: "Profile not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      profile,
    });

  } catch (error) {
    console.error(
      "ADMIN PROFILE DETAILS ERROR =>",
      error
    );

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