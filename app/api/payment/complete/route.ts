import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyRequestSession } from "@/lib/jwt";
import { calculateGstBreakdown, calculateGstFromGross } from "@/lib/gst";
import { getRegistrationPricingDetails } from "@/lib/pricing";
import { autoGenerateAndSaveBiodataPdf } from "@/lib/pdf/biodata-generator";

export async function POST(req: NextRequest) {
  try {
    const { session } = await verifyRequestSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in to complete activation." },
        { status: 401 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    const { profileId, promoCode, paymentMethod = "ONLINE_UPI", transactionRef } = body;

    if (!profileId) {
      return NextResponse.json(
        { success: false, message: "Profile ID is required" },
        { status: 400 }
      );
    }

    // Find profile (select only required user fields, omit password)
    const profile = await prisma.profile.findFirst({
      where: {
        OR: [{ id: String(profileId) }, { profileId: String(profileId) }],
      },
      include: {
        user: {
          select: {
            id: true,
            gender: true,
            mobile: true,
            email: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profile not found" },
        { status: 404 }
      );
    }

    if (session.role !== "ADMIN" && profile.userId !== session.userId) {
      return NextResponse.json(
        { success: false, message: "Forbidden: You are not authorized to complete payment for this profile." },
        { status: 403 }
      );
    }

    // Idempotency guard against double-submit
    if (profile.paymentCompleted) {
      const existingSuccess = await prisma.payment.findFirst({
        where: { profileId: profile.id, status: "SUCCESS" },
        orderBy: { createdAt: "desc" },
        select: { id: true, transactionId: true, grossAmount: true, invoiceUrl: true },
      });
      if (existingSuccess) {
        return NextResponse.json({
          success: true,
          message: "Payment already completed for this profile.",
          paymentId: existingSuccess.id,
          invoiceUrl: existingSuccess.invoiceUrl || `/invoice/${existingSuccess.id}`,
          transactionId: existingSuccess.transactionId,
          amount: Number(existingSuccess.grossAmount || 0),
        });
      }
    }

    const pricing = getRegistrationPricingDetails(profile.user?.gender);
    const isFemale = pricing.gender === "FEMALE";
    const baseFee = pricing.baseFee;

    let discountPercent = 0;
    let promoRecord: any = null;
    let isSamikshaSpecial = false;

    if (promoCode) {
      const cleanCode = String(promoCode).trim().toUpperCase();
      if (cleanCode === "SAMIKSHA251" && pricing.isOfferActive) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Special Launch Offer (₹99 + GST = ₹116.82) is already active and saves you more than 'SAMIKSHA251' (₹251)!",
          },
          { status: 400 }
        );
      }

      promoRecord = await prisma.promoCode.findUnique({
        where: { code: cleanCode },
      });

      if (!promoRecord) {
        return NextResponse.json(
          { success: false, message: "Invalid promo code." },
          { status: 400 }
        );
      }

      if (promoRecord.status !== "ACTIVE") {
        return NextResponse.json(
          { success: false, message: "This promo code has already been used or disabled." },
          { status: 400 }
        );
      }

      if (promoRecord.expiresAt && promoRecord.expiresAt.getTime() <= Date.now()) {
        return NextResponse.json(
          { success: false, message: "This promo code has expired." },
          { status: 400 }
        );
      }

      if (
        promoRecord.assignedProfileId &&
        promoRecord.assignedProfileId !== profile.id
      ) {
        return NextResponse.json(
          { success: false, message: "This promo code is assigned to another profile." },
          { status: 403 }
        );
      }

      if (
        promoRecord.assignedMobile &&
        promoRecord.assignedMobile !== profile.user?.mobile
      ) {
        return NextResponse.json(
          { success: false, message: "This promo code is assigned to another mobile number." },
          { status: 403 }
        );
      }

      if (
        promoRecord.assignedEmail &&
        (!profile.user?.email ||
          promoRecord.assignedEmail.trim().toLowerCase() !==
            profile.user.email.trim().toLowerCase())
      ) {
        return NextResponse.json(
          { success: false, message: "This promo code is assigned to another email address." },
          { status: 403 }
        );
      }

      if (cleanCode === "SAMIKSHA251" && isFemale) {
        isSamikshaSpecial = true;
      } else {
        discountPercent = Number(promoRecord.discountValue);
      }
    }

    let finalTotalAmount: number;
    if (isSamikshaSpecial) {
      finalTotalAmount = 251.0;
    } else {
      const discountAmount = Math.round(baseFee * (discountPercent / 100) * 100) / 100;
      const taxableAmount = Math.max(0, baseFee - discountAmount);
      const gstBreakdown = calculateGstBreakdown(taxableAmount);
      finalTotalAmount = gstBreakdown.totalAmount;
    }

    // Non-admins can only complete via this endpoint when 100% free via valid promo code
    if (session.role !== "ADMIN" && (!promoRecord || finalTotalAmount > 0)) {
      return NextResponse.json(
        {
          success: false,
          message: "Online payment via Razorpay is required to activate this membership.",
        },
        { status: 400 }
      );
    }

    const txnId = transactionRef || `RC_TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const gstSummary =
      finalTotalAmount > 0
        ? calculateGstFromGross(finalTotalAmount, 18, false)
        : { taxableAmount: 0, totalTax: 0 };
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // Pre-generate payment ID and resolve Official Profile ID before batch transaction
    const paymentId = crypto.randomUUID();
    const invoiceUrl = `/invoice/${paymentId}`;

    let officialProfileId = profile.profileId;
    if (profile.profileId.startsWith("DRAFT-") || profile.profileId === "DRAFT") {
      let candidateId = `RC${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      while (await prisma.profile.findUnique({ where: { profileId: candidateId }, select: { id: true } })) {
        candidateId = `RC${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      }
      officialProfileId = candidateId;
    }

    const txOps: any[] = [
      // Create Payment record
      prisma.payment.create({
        data: {
          id: paymentId,
          userId: profile.userId,
          profileId: profile.id,
          amount: finalTotalAmount,
          grossAmount: finalTotalAmount,
          taxableAmount: gstSummary.taxableAmount,
          gstRate: 18,
          gstAmount: gstSummary.totalTax,
          invoiceNumber,
          invoiceDate: now,
          invoiceUrl,
          paymentDate: now,
          status: "SUCCESS",
          paymentGateway: paymentMethod,
          transactionId: txnId,
        },
      }),
      // Update Profile: Directly LIVE upon verified completion
      prisma.profile.update({
        where: { id: profile.id },
        data: {
          profileId: officialProfileId,
          paymentCompleted: true,
          isVisible: true,
          approvalStatus: "APPROVED",
          approvedAt: profile.approvedAt || now,
        },
      }),
    ];

    // Atomically mark promo code used if applicable
    if (promoRecord && promoRecord.id) {
      txOps.push(
        prisma.promoCode.updateMany({
          where: {
            id: promoRecord.id,
            status: "ACTIVE",
            usedPaymentId: null,
          },
          data: {
            status: "USED",
            usedAt: now,
            usedPaymentId: paymentId,
          },
        })
      );
    }

    const [payment] = await prisma.$transaction(txOps);

    // Automated PDF Generation for paid profile
    autoGenerateAndSaveBiodataPdf(profile.id).catch((err) => {
      console.error("[Auto PDF generation error in complete payment]:", err);
    });

    return NextResponse.json({
      success: true,
      message: "Payment confirmed successfully. GST Invoice generated.",
      paymentId: payment.id,
      invoiceUrl,
      transactionId: txnId,
      amount: finalTotalAmount,
    });
  } catch (error) {
    console.error("PAYMENT COMPLETION ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process payment." },
      { status: 500 }
    );
  }
}
