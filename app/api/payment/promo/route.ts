import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GST_RATE = 0.18;

const ALLOWED_DISCOUNTS = [20, 50, 100];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      code,
      profileId,
      baseFee,
    } = body;

    // ==========================
    // BASIC VALIDATION
    // ==========================

    if (!code || !profileId) {
      return NextResponse.json(
        {
          success: false,
          message: "Promo code and Profile ID are required.",
        },
        { status: 400 }
      );
    }

    const numericBaseFee = Number(baseFee);

    if (
      !Number.isFinite(numericBaseFee) ||
      numericBaseFee <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid registration fee.",
        },
        { status: 400 }
      );
    }

    // ==========================
    // FIND PROFILE
    // ==========================

    const profile = await prisma.profile.findUnique({
      where: {
        profileId: String(profileId),
      },
      select: {
        id: true,
        profileId: true,
        user: {
          select: {
            email: true,
            mobile: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message: "Profile not found.",
        },
        { status: 404 }
      );
    }

    // ==========================
    // FIND PROMO CODE
    // ==========================

    const promoCode = await prisma.promoCode.findUnique({
      where: {
        code: String(code).trim().toUpperCase(),
      },
    });

    if (!promoCode) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid promo code.",
        },
        { status: 404 }
      );
    }

    // ==========================
    // STATUS CHECK
    // ==========================

    if (promoCode.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "This promo code is no longer active.",
        },
        { status: 400 }
      );
    }

    // ==========================
    // ALREADY USED CHECK
    // ==========================

    if (promoCode.usedAt || promoCode.usedPaymentId) {
      return NextResponse.json(
        {
          success: false,
          message: "This promo code has already been used.",
        },
        { status: 400 }
      );
    }

    // ==========================
    // EXPIRY CHECK
    // ==========================

    if (
      promoCode.expiresAt &&
      promoCode.expiresAt.getTime() <= Date.now()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This promo code has expired.",
        },
        { status: 400 }
      );
    }

    // ==========================
    // PROFILE ASSIGNMENT CHECK
    // ==========================

    if (
      promoCode.assignedProfileId &&
      promoCode.assignedProfileId !== profile.id
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This promo code is not assigned to this profile.",
        },
        { status: 403 }
      );
    }

    // ==========================
    // EMAIL ASSIGNMENT CHECK
    // ==========================

    if (
      promoCode.assignedEmail &&
      promoCode.assignedEmail.toLowerCase() !==
        (profile.user.email || "").toLowerCase()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This promo code is not assigned to this email address.",
        },
        { status: 403 }
      );
    }

    // ==========================
    // MOBILE ASSIGNMENT CHECK
    // ==========================

    if (
      promoCode.assignedMobile &&
      promoCode.assignedMobile !== profile.user.mobile
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This promo code is not assigned to this mobile number.",
        },
        { status: 403 }
      );
    }

    // ==========================
    // DISCOUNT TYPE CHECK
    // ==========================

    if (promoCode.discountType !== "PERCENTAGE") {
      return NextResponse.json(
        {
          success: false,
          message: "Unsupported promo code type.",
        },
        { status: 400 }
      );
    }

    const discountPercent =
      Number(promoCode.discountValue);

    if (
      !ALLOWED_DISCOUNTS.includes(discountPercent)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid promo code discount.",
        },
        { status: 400 }
      );
    }

    // ==========================
    // CALCULATE DISCOUNT
    // ==========================

    const discountAmount = Number(
      (
        numericBaseFee *
        (discountPercent / 100)
      ).toFixed(2)
    );

    const discountedFee = Number(
      (
        numericBaseFee -
        discountAmount
      ).toFixed(2)
    );

    // ==========================
    // GST AFTER DISCOUNT
    // ==========================

    const gstAmount = Number(
      (discountedFee * GST_RATE).toFixed(2)
    );

    const totalAmount = Number(
      (discountedFee + gstAmount).toFixed(2)
    );

    // ==========================
    // SUCCESS
    // ==========================

    return NextResponse.json({
      success: true,

      message: "Promo code applied successfully.",

      promoCode: {
        code: promoCode.code,
        discountPercent,
      },

      calculation: {
        baseFee: numericBaseFee,
        discountPercent,
        discountAmount,
        discountedFee,
        gstRate: GST_RATE,
        gstAmount,
        totalAmount,
      },
    });

  } catch (error) {
    console.error(
      "PROMO CODE VALIDATION ERROR =>",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to validate promo code.",
      },
      { status: 500 }
    );
  }
}