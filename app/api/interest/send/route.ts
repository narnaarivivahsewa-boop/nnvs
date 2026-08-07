import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    // ==========================
    // Verify Login
    // ==========================

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

    // ==========================
    // Body
    // ==========================

    const { receiverProfileId } = await req.json();

    if (!receiverProfileId) {
      return NextResponse.json(
        {
          success: false,
          message: "Receiver profile missing.",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================
    // Current User Profile
    // ==========================

    const myProfile = await prisma.profile.findUnique({
      where: {
        userId: payload.userId,
      },
    });

    if (!myProfile) {
      return NextResponse.json(
        {
          success: false,
          message: "Your profile not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ==========================
    // Cannot send to self
    // ==========================

    if (myProfile.id === receiverProfileId) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot send interest to yourself.",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================
    // Already Sent?
    // ==========================

    const existing = await prisma.interest.findFirst({
      where: {
        senderProfileId: myProfile.id,
        receiverProfileId,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Interest already sent.",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================
    // Create Interest
    // ==========================

    await prisma.interest.create({
      data: {
        senderProfileId: myProfile.id,
        receiverProfileId,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Interest sent successfully.",
    });

  } catch (error) {
    console.error("SEND INTEREST ERROR =>", error);

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