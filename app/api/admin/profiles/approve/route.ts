import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { profileId } = await req.json();

    if (!profileId) {
      return NextResponse.json(
        {
          success: false,
          message: "Profile ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: {
        id: profileId,
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

    await prisma.profile.update({
      where: {
        id: profileId,
      },
      data: {
        approvalStatus: "APPROVED",
        isVisible: true,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile approved successfully.",
    });

  } catch (error) {
    console.error("APPROVE PROFILE ERROR =>", error);

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