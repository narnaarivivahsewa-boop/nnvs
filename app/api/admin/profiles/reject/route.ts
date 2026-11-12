import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    const targetId = body.profileId || body.id;

    if (!targetId) {
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

    const profile = await prisma.profile.findFirst({
      where: {
        OR: [{ id: String(targetId) }, { profileId: String(targetId) }],
      },
      select: { id: true },
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
        id: profile.id,
      },
      data: {
        approvalStatus: "REJECTED",
        isVisible: false,
        approvedAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile rejected successfully.",
    });
  } catch (error) {
    console.error("REJECT PROFILE ERROR =>", error);

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