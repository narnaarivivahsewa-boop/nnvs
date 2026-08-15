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
      discount,
      profileId,
      email,
      mobile,
      expiresAt,
    } = body;

    // ==========================
    // VALIDATE DISCOUNT
    // ==========================

    if (![20, 50, 100].includes(Number(discount))) {
      return NextResponse.json(
        {
          success: false,
          message: "Discount must be 20%, 50% or 100%.",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================
    // AT LEAST ONE ASSIGNMENT
    // ==========================

    if (!profileId && !email && !mobile) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Coupon must be assigned to a Profile ID, email or mobile.",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================
    // VERIFY PROFILE
    // ==========================

    let assignedProfileId: string | null = null;

    if (profileId) {
      const profile = await prisma.profile.findUnique({
        where: {
          profileId: String(profileId),
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
            message: "Profile not found.",
          },
          {
            status: 404,
          }
        );
      }

      assignedProfileId = profile.id;
    }

    // ==========================
    // GENERATE SECURE CODE
    // ==========================

    let code = "";
    let exists = true;

    while (exists) {
      code = generatePromoCode(Number(discount));

      const existing = await prisma.promoCode.findUnique({
        where: {
          code,
        },
        select: {
          id: true,
        },
      });

      exists = !!existing;
    }

    // ==========================
    // CREATE PROMO CODE
    // ==========================

    const promoCode = await prisma.promoCode.create({
      data: {
        code,

        discountType: "PERCENTAGE",
        discountValue: Number(discount),

        assignedProfileId,
        assignedEmail: email
          ? String(email).trim().toLowerCase()
          : null,

        assignedMobile: mobile
          ? String(mobile).trim()
          : null,

        expiresAt: expiresAt
          ? new Date(expiresAt)
          : null,

        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Promo code created successfully.",
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
    console.error(
      "ADMIN PROMO CODE CREATE ERROR =>",
      error
    );

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