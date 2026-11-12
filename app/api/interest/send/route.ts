import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRequestSession } from "@/lib/jwt";
import { getActiveProfileForUser } from "@/lib/auth/active-profile";

export async function POST(req: NextRequest) {
  try {
    // ==========================
    // Verify Login
    // ==========================

    const { session: payload } = await verifyRequestSession(req);

    if (!payload) {
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

    // ==========================
    // Body
    // ==========================

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request payload.",
        },
        { status: 400 }
      );
    }

    const rawReceiverId =
      typeof body?.receiverProfileId === "string"
        ? body.receiverProfileId.trim()
        : "";

    if (!rawReceiverId) {
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
    // Current User Active Profile
    // ==========================

    const myProfile = await getActiveProfileForUser(
      req,
      payload.userId,
      payload.activeProfileId
    );

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

    const targetProfile = await prisma.profile.findFirst({
      where: {
        OR: [{ id: rawReceiverId }, { profileId: rawReceiverId }],
      },
      select: { id: true },
    });

    if (!targetProfile) {
      return NextResponse.json(
        {
          success: false,
          message: "Receiver profile not found.",
        },
        {
          status: 404,
        }
      );
    }

    const receiverProfileId = targetProfile.id;

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