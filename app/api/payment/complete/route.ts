import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BUSINESS_INFO, calculateGstBreakdown } from "@/lib/gst";
import { autoGenerateAndSaveBiodataPdf } from "@/lib/pdf/biodata-generator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profileId, promoCode, paymentMethod = "ONLINE_UPI", transactionRef } = body;

    if (!profileId) {
      return NextResponse.json(
        { success: false, message: "Profile ID is required" },
        { status: 400 }
      );
    }

    // Find profile
    const profile = await prisma.profile.findUnique({
      where: { profileId: String(profileId) },
      include: {
        user: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profile not found" },
        { status: 404 }
      );
    }

    const isFemale = profile.user.gender === "FEMALE";
    const baseFee = isFemale ? BUSINESS_INFO.fees.female : BUSINESS_INFO.fees.male;

    let discountPercent = 0;
    let promoRecord = null;
    let isSamikshaSpecial = false;

    if (promoCode) {
      const cleanCode = String(promoCode).trim().toUpperCase();
      promoRecord = await prisma.promoCode.findUnique({
        where: { code: cleanCode },
      });

      if (
        promoRecord &&
        promoRecord.status === "ACTIVE" &&
        (!promoRecord.expiresAt || promoRecord.expiresAt.getTime() > Date.now()) &&
        (!promoRecord.assignedProfileId || promoRecord.assignedProfileId === profile.id) &&
        (!promoRecord.assignedMobile || promoRecord.assignedMobile === profile.user.mobile)
      ) {
        if (cleanCode === "SAMIKSHA251" && isFemale) {
          isSamikshaSpecial = true;
        } else {
          discountPercent = Number(promoRecord.discountValue);
        }
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

    const txnId = transactionRef || `RC_TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await prisma.$transaction(async (tx) => {
      // Create Payment record
      const payment = await tx.payment.create({
        data: {
          userId: profile.userId,
          amount: finalTotalAmount,
          status: "SUCCESS",
          paymentGateway: paymentMethod,
          transactionId: txnId,
        },
      });

      // Rule 2: Official Profile ID is assigned only upon confirmed payment
      let officialProfileId = profile.profileId;
      if (profile.profileId.startsWith("DRAFT-") || profile.profileId === "DRAFT") {
        let candidateId = `RC${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
        while (await tx.profile.findUnique({ where: { profileId: candidateId } })) {
          candidateId = `RC${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
        }
        officialProfileId = candidateId;
      }

      // Update Profile: Directly LIVE upon verified payment completion
      await tx.profile.update({
        where: { id: profile.id },
        data: {
          profileId: officialProfileId,
          paymentCompleted: true,
          isVisible: true,
          approvalStatus: "APPROVED",
          approvedAt: profile.approvedAt || new Date(),
        },
      });

      // Mark promo code used if applicable
      if (promoRecord && promoRecord.id) {
        await tx.promoCode.update({
          where: { id: promoRecord.id },
          data: {
            status: "USED",
            usedAt: new Date(),
            usedPaymentId: payment.id,
          },
        });
      }

      return payment;
    });

    // Automated PDF Generation for paid profile
    autoGenerateAndSaveBiodataPdf(profile.id).catch((err) => {
      console.error("[Auto PDF generation error in complete payment]:", err);
    });

    return NextResponse.json({
      success: true,
      message: "Payment confirmed successfully. GST Invoice generated.",
      paymentId: result.id,
      invoiceUrl: `/invoice/${result.id}`,
      transactionId: txnId,
      amount: finalTotalAmount,
    });
  } catch (error: any) {
    console.error("PAYMENT COMPLETION ERROR:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to process payment." },
      { status: 500 }
    );
  }
}
