import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BUSINESS_INFO, calculateGstBreakdown } from "@/lib/gst";

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

    if (promoCode) {
      promoRecord = await prisma.promoCode.findUnique({
        where: { code: String(promoCode).trim().toUpperCase() },
      });

      if (
        promoRecord &&
        promoRecord.status === "ACTIVE" &&
        (!promoRecord.expiresAt || promoRecord.expiresAt.getTime() > Date.now()) &&
        (!promoRecord.assignedProfileId || promoRecord.assignedProfileId === profile.id) &&
        (!promoRecord.assignedMobile || promoRecord.assignedMobile === profile.user.mobile)
      ) {
        discountPercent = Number(promoRecord.discountValue);
      }
    }

    const discountAmount = Math.round(baseFee * (discountPercent / 100) * 100) / 100;
    const taxableAmount = Math.max(0, baseFee - discountAmount);
    const gstBreakdown = calculateGstBreakdown(taxableAmount);
    const finalTotalAmount = gstBreakdown.totalAmount;

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

      // Update Profile
      await tx.profile.update({
        where: { id: profile.id },
        data: {
          paymentCompleted: true,
          isVisible: true,
          approvalStatus: profile.approvalStatus === "DRAFT" ? "UNDER_REVIEW" : profile.approvalStatus,
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
