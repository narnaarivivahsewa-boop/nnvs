import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

function generatePromoCode(discount: number) {
  const randomPart = crypto
    .randomBytes(6)
    .toString("hex")
    .toUpperCase();

  return `NNVS-${discount}-${randomPart}`;
}

async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get("nnvs_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = await verifyToken(token);

    if (payload.role !== "ADMIN") {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // ==========================
    // ADMIN AUTHENTICATION
    // ==========================

    const admin = await verifyAdmin(req);

    if (!admin) {
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
    // REQUEST BODY
    // ==========================

    const body = await req.json();

    const {
      customCode,
      discount,
      profileId,
      email,
      mobile,
      expiresAt,
    } = body;

    // ==========================
    // VALIDATE DISCOUNT
    // ==========================

    const discountNum = Number(discount);
    if (isNaN(discountNum) || discountNum < 1 || discountNum > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Discount must be between 1% and 100%.",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================
    // VERIFY PROFILE (IF PROVIDED)
    // ==========================

    let assignedProfileId: string | null = null;

    if (profileId && String(profileId).trim()) {
      const profile = await prisma.profile.findFirst({
        where: {
          OR: [
            { id: String(profileId).trim() },
            { profileId: String(profileId).trim() },
          ],
        },
        select: {
          id: true,
          profileId: true,
        },
      });

      if (!profile) {
        return NextResponse.json(
          {
            success: false,
            message: `Profile '${profileId}' not found. Please verify the Profile ID.`,
          },
          {
            status: 404,
          }
        );
      }

      assignedProfileId = profile.id;
    }

    // ==========================
    // DETERMINE CODE STRING
    // ==========================

    let code = "";
    if (customCode && String(customCode).trim()) {
      code = String(customCode).trim().toUpperCase();

      const existing = await prisma.promoCode.findUnique({
        where: { code },
        select: { id: true },
      });

      if (existing) {
        return NextResponse.json(
          {
            success: false,
            message: `Promo code '${code}' already exists. Please choose a different code.`,
          },
          {
            status: 400,
          }
        );
      }
    } else {
      let exists = true;
      while (exists) {
        code = generatePromoCode(discountNum);

        const existing = await prisma.promoCode.findUnique({
          where: { code },
          select: { id: true },
        });

        exists = !!existing;
      }
    }

    // ==========================
    // CREATE PROMO CODE
    // ==========================

    const promoCode = await prisma.promoCode.create({
      data: {
        code,
        discountType: "PERCENTAGE",
        discountValue: discountNum,
        assignedProfileId,
        assignedEmail: email ? String(email).trim().toLowerCase() : null,
        assignedMobile: mobile ? String(mobile).trim() : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Promo code ${promoCode.code} created successfully.`,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        discount: Number(promoCode.discountValue),
        status: promoCode.status,
        expiresAt: promoCode.expiresAt,
        assignedProfileId: promoCode.assignedProfileId,
        assignedEmail: promoCode.assignedEmail,
        assignedMobile: promoCode.assignedMobile,
      },
    });

  } catch (error) {
    console.error("ADMIN PROMO CODE CREATE ERROR =>", error);

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

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const promoCodes = await prisma.promoCode.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        assignedProfile: {
          select: {
            id: true,
            profileId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      promoCodes,
    });
  } catch (error) {
    console.error("ADMIN PROMO CODES LIST ERROR =>", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Promo code ID is required" },
        { status: 400 }
      );
    }

    await prisma.promoCode.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Promo code deleted successfully.",
    });
  } catch (error: any) {
    console.error("ADMIN PROMO CODE DELETE ERROR =>", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to delete promo code.",
      },
      { status: 500 }
    );
  }
}