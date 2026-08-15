import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("nnvs_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    const session = await verifyToken(token);

    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      select: {
        id: true,
        fullName: true,
        mobile: true,
        email: true,
        gender: true,
        role: true,
        status: true,
        mobileVerified: true,

        profile: {
          select: {
            id: true,
            profileId: true,
            profileCompletion: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            height: true,
            maritalStatus: true,
            religion: true,
            caste: true,
            motherTongue: true,
            isVisible: true,
            paymentCompleted: true,
            approvalStatus: true,
            approvedAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User account not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("AUTH ME ERROR =>", error);

    return NextResponse.json(
      {
        success: false,
        message: "Invalid or expired session.",
      },
      { status: 401 }
    );
  }
}