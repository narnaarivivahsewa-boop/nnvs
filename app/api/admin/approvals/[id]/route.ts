import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const body = await req.json();

    const { action } = body;

    if (
      action !== "APPROVE" &&
      action !== "REJECT"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Action",
        },
        {
          status: 400,
        }
      );
    }

    const profile =
      await prisma.profile.findUnique({
        where: {
          id,
        },
      });

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message: "Profile not found",
        },
        {
          status: 404,
        }
      );
    }

    const updatedProfile =
      await prisma.profile.update({
        where: {
          id,
        },
        data: {
          approvalStatus:
            action === "APPROVE"
              ? "APPROVED"
              : "REJECTED",

          approvedAt:
            action === "APPROVE"
              ? new Date()
              : null,
        },
      });

    return NextResponse.json({
      success: true,
      message:
        action === "APPROVE"
          ? "Profile Approved Successfully"
          : "Profile Rejected Successfully",

      profile: updatedProfile,
    });

  } catch (error: any) {

    console.error(
      "APPROVAL UPDATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Something went wrong.",
      },
      {
        status: 500,
      }
    );

  }
}