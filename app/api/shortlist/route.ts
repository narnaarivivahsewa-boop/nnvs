import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRequestSession } from "@/lib/jwt";
import { getActiveProfileForUser } from "@/lib/auth/active-profile";

export async function GET(req: NextRequest) {
  try {
    const { session: payload } = await verifyRequestSession(req);

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const shortlistedProfileId = searchParams.get(
      "shortlistedProfileId"
    )?.trim();

    if (!shortlistedProfileId) {
      return NextResponse.json(
        {
          success: false,
          message: "Profile ID missing.",
        },
        { status: 400 }
      );
    }

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
        { status: 404 }
      );
    }

    const shortlist = await prisma.shortlist.findFirst({
      where: {
        profileId: myProfile.id,
        shortlistedProfileId,
      },
    });

    return NextResponse.json({
      success: true,
      shortlisted: !!shortlist,
    });
  } catch (error) {
    console.error("CHECK SHORTLIST ERROR =>", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session: payload } = await verifyRequestSession(req);

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

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

    const rawShortlistedId =
      typeof body?.shortlistedProfileId === "string"
        ? body.shortlistedProfileId.trim()
        : "";

    if (!rawShortlistedId) {
      return NextResponse.json(
        {
          success: false,
          message: "Profile ID missing.",
        },
        { status: 400 }
      );
    }

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
        { status: 404 }
      );
    }

    const targetProfile = await prisma.profile.findFirst({
      where: {
        OR: [{ id: rawShortlistedId }, { profileId: rawShortlistedId }],
      },
      select: { id: true },
    });

    if (!targetProfile) {
      return NextResponse.json(
        {
          success: false,
          message: "Profile not found.",
        },
        { status: 404 }
      );
    }

    const shortlistedProfileId = targetProfile.id;

    if (myProfile.id === shortlistedProfileId) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot shortlist yourself.",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.shortlist.findFirst({
      where: {
        profileId: myProfile.id,
        shortlistedProfileId,
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        shortlisted: true,
        message: "Profile already shortlisted.",
      });
    }

    await prisma.shortlist.create({
      data: {
        profileId: myProfile.id,
        shortlistedProfileId,
      },
    });

    return NextResponse.json({
      success: true,
      shortlisted: true,
      message: "Profile shortlisted successfully.",
    });
  } catch (error) {
    console.error("ADD SHORTLIST ERROR =>", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { session: payload } = await verifyRequestSession(req);

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

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

    const rawShortlistedId =
      typeof body?.shortlistedProfileId === "string"
        ? body.shortlistedProfileId.trim()
        : "";

    if (!rawShortlistedId) {
      return NextResponse.json(
        {
          success: false,
          message: "Profile ID missing.",
        },
        { status: 400 }
      );
    }

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
        { status: 404 }
      );
    }

    const targetProfile = await prisma.profile.findFirst({
      where: {
        OR: [{ id: rawShortlistedId }, { profileId: rawShortlistedId }],
      },
      select: { id: true },
    });

    const shortlistedProfileId = targetProfile?.id || rawShortlistedId;

    await prisma.shortlist.deleteMany({
      where: {
        profileId: myProfile.id,
        shortlistedProfileId,
      },
    });

    return NextResponse.json({
      success: true,
      shortlisted: false,
      message: "Profile removed from shortlist.",
    });
  } catch (error) {
    console.error("REMOVE SHORTLIST ERROR =>", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}