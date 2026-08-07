import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "";

    const profiles = await prisma.profile.findMany({
      where: {
        ...(status
          ? {
              approvalStatus: status as any,
            }
          : {}),

        ...(search
          ? {
              OR: [
                {
                  profileId: {
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
            }
          : {}),
      },

      orderBy: {
        createdAt: "desc",
      },

      include: {
        user: {
          select: {
            fullName: true,
            mobile: true,
            gender: true,
            status: true,
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

  } catch (error) {
    console.error("ADMIN PROFILES API ERROR =>", error);

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