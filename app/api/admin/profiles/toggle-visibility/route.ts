import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { profileId, isVisible } = await req.json();

    if (!profileId) {
      return NextResponse.json(
        { success: false, message: "Profile ID is required" },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.findFirst({
      where: {
        OR: [{ id: profileId }, { profileId: profileId }],
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profile not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.profile.update({
      where: { id: profile.id },
      data: {
        isVisible: isVisible !== undefined ? Boolean(isVisible) : !profile.isVisible,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Profile is now ${updated.isVisible ? "LIVE (Visible)" : "HIDDEN"}.`,
      isVisible: updated.isVisible,
    });
  } catch (error: any) {
    console.error("TOGGLE VISIBILITY ERROR:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update profile visibility" },
      { status: 500 }
    );
  }
}
