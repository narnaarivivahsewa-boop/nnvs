import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{ profileId: string }>;
  }
) {
  try {
    const { profileId } = await context.params;

    const profile = await prisma.profile.findUnique({
      where: {
        profileId,
      },

      include: {
        user: {
          select: {
            fullName: true,
            gender: true,
            mobile: true,
            email: true,
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
    console.error("PROFILE DETAILS API ERROR =>", error);

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