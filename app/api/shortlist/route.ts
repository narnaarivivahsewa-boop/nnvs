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
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);

    const { searchParams } = new URL(req.url);
    const shortlistedProfileId = searchParams.get(
      "shortlistedProfileId"
    );

    if (!shortlistedProfileId) {
      return NextResponse.json(
        {
          success: false,
          message: "Profile ID missing.",
        },
        { status: 400 }
      );
    }

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
    const token = req.cookies.get("nnvs_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);

    const { shortlistedProfileId } = await req.json();

    if (!shortlistedProfileId) {
      return NextResponse.json(
        {
          success: false,
          message: "Profile ID missing.",
        },
        { status: 400 }
      );
    }

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
        { status: 404 }
      );
    }

    if (myProfile.id === shortlistedProfileId) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot shortlist yourself.",
        },
        { status: 400 }
      );
    }

    const targetProfile = await prisma.profile.findUnique({
      where: {
        id: shortlistedProfileId,
      },
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
    const token = req.cookies.get("nnvs_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);

    const { shortlistedProfileId } = await req.json();

    if (!shortlistedProfileId) {
      return NextResponse.json(
        {
          success: false,
          message: "Profile ID missing.",
        },
        { status: 400 }
      );
    }

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
        { status: 404 }
      );
    }

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