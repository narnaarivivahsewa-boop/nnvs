import { NextRequest, NextResponse } from "next/server";
import { getRazorpayClient, getRazorpayCredentials } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { getRegistrationPricingDetails, isLaunchOfferActive } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body provided." },
        { status: 400 }
      );
    }

    const {
      service,
      profileId,
      promoCode,
      gender: clientGender,
      currency = "INR",
      receipt,
      notes = {},
    } = body;

    // ==========================================
    // STRICT SERVER-SIDE PRICING CALCULATION
    // ==========================================
    let profile = null;
    if (profileId) {
      // Lookup profile and user to determine true gender (omit sensitive fields)
      profile = await prisma.profile.findFirst({
        where: {
          OR: [{ id: String(profileId) }, { profileId: String(profileId) }],
        },
        select: {
          id: true,
          profileId: true,
          user: {
            select: {
              id: true,
              gender: true,
              email: true,
              mobile: true,
            },
          },
        },
      });
    }

    const detectedGender = (
      profile?.user?.gender ||
      clientGender ||
      "MALE"
    ).toUpperCase();

    const registrationPricing = getRegistrationPricingDetails(detectedGender);
    const offerActive = registrationPricing.isOfferActive;
    const isFemaleRegistration = registrationPricing.gender === "FEMALE";

    let baseAmountRupees = registrationPricing.baseFee;
    let serviceName = isFemaleRegistration
      ? offerActive
        ? "Matrimony Female Membership Registration (Launch Offer)"
        : "Matrimony Female Membership Registration"
      : offerActive
      ? "Matrimony Male Membership Registration (Launch Offer)"
      : "Matrimony Male Membership Registration";

    if (service === "ASTROLOGY" || notes?.service === "ASTROLOGY") {
      baseAmountRupees = 99;
      serviceName = "AI Vedic Astrological Remedies & Suggestion";
    }

    // Standard 18% GST calculation
    let gstAmountRupees = Math.round(baseAmountRupees * 0.18 * 100) / 100;
    let grossAmountRupees = Math.round((baseAmountRupees + gstAmountRupees) * 100) / 100;
    let validatedPromoCode: string | null = null;

    // ==========================================
    // SERVER-SIDE PROMO CODE VALIDATION & PRICING
    // ==========================================
    if (promoCode && service !== "ASTROLOGY") {
      const cleanCode = String(promoCode).trim().toUpperCase();

      const promoRecord = await prisma.promoCode.findUnique({
        where: { code: cleanCode },
      });

      if (!promoRecord) {
        return NextResponse.json(
          { success: false, message: "Invalid coupon code." },
          { status: 400 }
        );
      }

      if (
        promoRecord.status !== "ACTIVE" ||
        promoRecord.usedAt ||
        promoRecord.usedPaymentId
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This coupon code has already been used and is no longer valid.",
          },
          { status: 400 }
        );
      }

      if (
        promoRecord.expiresAt &&
        promoRecord.expiresAt.getTime() <= Date.now()
      ) {
        return NextResponse.json(
          { success: false, message: "This coupon code has expired." },
          { status: 400 }
        );
      }

      // Check profile/mobile/email assignment if restricted
      if (
        promoRecord.assignedProfileId &&
        (!profile || promoRecord.assignedProfileId !== profile.id)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "This coupon code is not assigned to this profile.",
          },
          { status: 403 }
        );
      }

      if (
        promoRecord.assignedEmail &&
        (!profile?.user?.email ||
          promoRecord.assignedEmail.toLowerCase() !==
            profile.user.email.toLowerCase())
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "This coupon code is not assigned to this email address.",
          },
          { status: 403 }
        );
      }

      if (
        promoRecord.assignedMobile &&
        (!profile?.user?.mobile ||
          promoRecord.assignedMobile !== profile.user.mobile)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "This coupon code is not assigned to this mobile number.",
          },
          { status: 403 }
        );
      }

      // Special rule: SAMIKSHA251 (Female Only, ₹251 total incl. GST)
      if (cleanCode === "SAMIKSHA251") {
        if (isLaunchOfferActive()) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Special Launch Offer (₹99 + GST = ₹116.82) is already active and saves you more than coupon 'Samiksha251' (₹251)!",
            },
            { status: 400 }
          );
        }

        if (!isFemaleRegistration) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Coupon 'Samiksha251' is strictly applicable only for female registration.",
            },
            { status: 400 }
          );
        }

        grossAmountRupees = 251.0;
        baseAmountRupees = 212.71;
        gstAmountRupees = 38.29;
        serviceName = "Matrimony Female Registration (Coupon Samiksha251 Applied)";
        validatedPromoCode = "SAMIKSHA251";
      } else if (promoRecord.discountType === "PERCENTAGE") {
        const discountPercent = Number(promoRecord.discountValue);
        const discountAmount =
          Math.round(baseAmountRupees * (discountPercent / 100) * 100) / 100;
        baseAmountRupees = Math.max(
          0,
          Math.round((baseAmountRupees - discountAmount) * 100) / 100
        );
        gstAmountRupees = Math.round(baseAmountRupees * 0.18 * 100) / 100;
        grossAmountRupees =
          Math.round((baseAmountRupees + gstAmountRupees) * 100) / 100;
        validatedPromoCode = cleanCode;
      }
    }

    const amountInPaise = Math.round(grossAmountRupees * 100);

    if (!Number.isFinite(amountInPaise) || amountInPaise < 100) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order payable amount must be at least ₹1.00. For 100% discount codes, please use free membership activation.",
        },
        { status: 400 }
      );
    }

    let credentials;
    try {
      credentials = getRazorpayCredentials();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Payment gateway configuration is temporarily unavailable.",
        },
        { status: 500 }
      );
    }

    const razorpay = getRazorpayClient();

    const orderOptions = {
      amount: amountInPaise, // strictly server-calculated paise (e.g. 25100 for SAMIKSHA251)
      currency: String(currency).toUpperCase(),
      receipt: receipt || `rcpt_${profileId || "ast"}_${Date.now()}`,
      notes: {
        ...notes,
        service: service === "ASTROLOGY" ? "ASTROLOGY" : "MEMBERSHIP",
        serviceName,
        baseAmount: String(baseAmountRupees),
        gstAmount: String(gstAmountRupees),
        grossAmount: String(grossAmountRupees),
        profileId: profileId || "N/A",
        promoCode: validatedPromoCode || "NONE",
        source: "RishteClub Server-Enforced Checkout",
      },
    };

    const order = await razorpay.orders.create(orderOptions);

    return NextResponse.json(
      {
        success: true,
        order_id: order.id,
        id: order.id,
        amount: order.amount,
        amountInRupees: grossAmountRupees,
        baseAmountRupees,
        gstAmountRupees,
        currency: order.currency,
        receipt: order.receipt,
        key_id: credentials.keyId,
        serviceName,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("RAZORPAY ORDER CREATION ERROR:", error);
    const status =
      typeof error?.statusCode === "number" &&
      error.statusCode >= 400 &&
      error.statusCode < 600
        ? error.statusCode
        : 500;
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create Razorpay order. Please try again.",
      },
      { status }
    );
  }
}
