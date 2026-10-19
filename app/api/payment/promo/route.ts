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
      gender: clientGender,
    } = body;

    // ==========================
    // BASIC VALIDATION
    // ==========================

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          message: "Promo code is required.",
        },
        { status: 400 }
      );
    }

    const cleanCode = String(code).trim().toUpperCase();

    // ==========================
    // FIND PROFILE (IF PROVIDED)
    // ==========================

    let profile = null;
    if (profileId) {
      profile = await prisma.profile.findFirst({
        where: {
          OR: [{ id: String(profileId) }, { profileId: String(profileId) }],
        },
        select: {
          id: true,
          profileId: true,
          user: {
            select: {
              email: true,
              mobile: true,
              gender: true,
            },
          },
        },
      });
    }

    const detectedGender = (
      profile?.user?.gender ||
      clientGender ||
      ""
    ).toUpperCase();

    // ==========================
    // FIND PROMO CODE
    // ==========================

    const promoCode = await prisma.promoCode.findUnique({
      where: {
        code: cleanCode,
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
          message: "This promo code has already been used and is no longer valid.",
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
      profile &&
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
      profile?.user?.email &&
      promoCode.assignedEmail.toLowerCase() !==
        profile.user.email.toLowerCase()
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
      profile?.user?.mobile &&
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

    // ==========================================
    // SPECIAL COUPON: SAMIKSHA251 (Female ₹251)
    // ==========================================

    if (cleanCode === "SAMIKSHA251") {
      if (detectedGender && detectedGender !== "FEMALE") {
        return NextResponse.json(
          {
            success: false,
            message: "Coupon 'Samiksha251' is strictly applicable only for female registration.",
          },
          { status: 400 }
        );
      }

      // Total ₹251.00 including 18% GST:
      // Base = 212.71, GST = 38.29 (CGST 19.14 + SGST 19.15)
      const originalFemaleBase = 399.0;
      const originalFemaleTotal = 470.82;
      const totalAmount = 251.0;
      const baseFee = 212.71;
      const gstAmount = 38.29;
      const cgstAmount = 19.14;
      const sgstAmount = 19.15;
      const discountAmount = Number((originalFemaleTotal - totalAmount).toFixed(2));

      return NextResponse.json({
        success: true,
        message: "Coupon 'Samiksha251' applied! Special female registration fee ₹251 (incl. 18% GST).",
        promoCode: {
          code: "SAMIKSHA251",
          discountType: "FIXED_TOTAL",
          discountAmount,
        },
        calculation: {
          originalBaseFee: originalFemaleBase,
          originalTotalAmount: originalFemaleTotal,
          baseFee,
          discountAmount,
          discountedFee: baseFee,
          gstRate: GST_RATE,
          cgstAmount,
          sgstAmount,
          gstAmount,
          totalAmount,
        },
      });
    }

    // ==========================
    // PERCENTAGE DISCOUNT CODES
    // ==========================

    const numericBaseFee = Number(baseFee) || 399;

    if (promoCode.discountType !== "PERCENTAGE") {
      return NextResponse.json(
        {
          success: false,
          message: "Unsupported promo code type.",
        },
        { status: 400 }
      );
    }

    const discountPercent = Number(promoCode.discountValue);

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

    const gstAmount = Number(
      (discountedFee * GST_RATE).toFixed(2)
    );

    const totalAmount = Number(
      (discountedFee + gstAmount).toFixed(2)
    );

    return NextResponse.json({
      success: true,
      message: `Promo code applied successfully (${discountPercent}% OFF).`,
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
        cgstAmount: Number((gstAmount / 2).toFixed(2)),
        sgstAmount: Number((gstAmount / 2).toFixed(2)),
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