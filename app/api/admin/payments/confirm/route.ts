import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { calculateGstFromGross } from "@/lib/gst";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const {
      profileId,
      userId,
      grossAmount,
      isPaymentExempt = false,
      exemptionReason,
      paymentDate,
      transactionId,
      screenshotUrl,
      adminNotes,
      isInterstate = false,
    } = body;

    if (!profileId && !userId) {
      return NextResponse.json(
        { success: false, message: "Profile ID or User ID is required." },
        { status: 400 }
      );
    }

    // Lookup profile
    let profile = null;
    if (profileId) {
      profile = await prisma.profile.findFirst({
        where: {
          OR: [{ id: profileId }, { profileId: profileId }],
        },
        include: { user: true },
      });
    } else if (userId) {
      profile = await prisma.profile.findFirst({
        where: { userId },
        include: { user: true },
      });
    }

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profile not found." },
        { status: 404 }
      );
    }

    // Check if admin user exists in DB for audit log foreign key relation
    let validAdminUserId: string | null = null;
    if (auth.user?.userId) {
      const adminUserRecord = await prisma.user.findUnique({
        where: { id: auth.user.userId },
        select: { id: true },
      });
      if (adminUserRecord) {
        validAdminUserId = adminUserRecord.id;
      }
    }

    const now = new Date();
    const paymentDateObj = paymentDate ? new Date(paymentDate) : now;

    // ==========================================
    // OPTION 1: PAYMENT EXEMPT (₹0, No GST Invoice)
    // ==========================================
    if (isPaymentExempt) {
      const reasonText = (exemptionReason || adminNotes || "").trim();
      if (!reasonText || reasonText.length < 3) {
        return NextResponse.json(
          { success: false, message: "Please provide a mandatory reason for marking this profile as Payment-Exempt." },
          { status: 400 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1. Create Payment record marked as PAYMENT_EXEMPT with 0 GST and no invoice
        const payment = await tx.payment.create({
          data: {
            userId: profile.userId,
            profileId: profile.id,
            amount: 0,
            grossAmount: 0,
            taxableAmount: 0,
            gstRate: 0,
            gstAmount: 0,
            status: "SUCCESS",
            paymentGateway: "PAYMENT_EXEMPT",
            transactionId: transactionId || `EXEMPT_${Date.now()}`,
            paymentDate: paymentDateObj,
            screenshotUrl: screenshotUrl || null,
            adminNotes: reasonText,
            confirmedByAdmin: true,
            confirmedAt: now,
            invoiceNumber: null,
            invoiceDate: null,
            invoiceUrl: null,
          },
        });

        // 2. Make Profile Live & Approved
        await tx.profile.update({
          where: { id: profile.id },
          data: {
            paymentCompleted: true,
            isVisible: true,
            approvalStatus: "APPROVED",
            approvedAt: now,
          },
        });

        // 3. Create AuditLog entry
        await tx.auditLog.create({
          data: {
            userId: validAdminUserId,
            action: "PAYMENT_EXEMPT_MARKED",
            module: "PAYMENT",
            details: JSON.stringify({
              paymentId: payment.id,
              profileId: profile.profileId,
              candidateName: profile.user?.fullName || "Candidate",
              grossAmount: 0,
              paymentGateway: "PAYMENT_EXEMPT",
              reason: reasonText,
              confirmedByAdminMobile: auth.user.mobile,
              timestamp: now.toISOString(),
            }),
            ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
          },
        });

        return payment;
      });

      return NextResponse.json({
        success: true,
        message: `Profile marked as Payment-Exempt successfully (₹0). Profile is now LIVE and Approved. No GST Invoice was generated.`,
        paymentId: result.id,
        isPaymentExempt: true,
      });
    }

    // ==========================================
    // OPTION 2: NORMAL PAID PAYMENT (> ₹0)
    // ==========================================
    const setting = await prisma.adminSetting.findFirst();
    const gstPercentage = Number(setting?.gstPercentage || 18);
    const grossAmountNum = Number(grossAmount || setting?.registrationFee || 1100);

    if (isNaN(grossAmountNum) || grossAmountNum <= 0) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid gross amount received (including GST) greater than ₹0, or check 'Mark as No Payment / Payment Exempt'." },
        { status: 400 }
      );
    }

    // Authoritative calculation from admin-confirmed gross amount
    const gstBreakdown = calculateGstFromGross(grossAmountNum, gstPercentage, Boolean(isInterstate));

    // Generate unique invoice number: TT/YYYY-YY/INV-<UID>
    const year = now.getFullYear();
    const financialYear = `${year}-${(year + 1).toString().slice(-2)}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `TT/${financialYear}/INV-${Date.now().toString().slice(-4)}${randomSuffix}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Payment record
      const payment = await tx.payment.create({
        data: {
          userId: profile.userId,
          profileId: profile.id,
          amount: grossAmountNum,
          grossAmount: grossAmountNum,
          taxableAmount: gstBreakdown.taxableAmount,
          gstRate: gstPercentage,
          gstAmount: gstBreakdown.totalTax,
          status: "SUCCESS",
          paymentGateway: "MANUAL_ADMIN_CONFIRMATION",
          transactionId: transactionId || `MANUAL_REF_${Date.now()}`,
          paymentDate: paymentDateObj,
          screenshotUrl: screenshotUrl || null,
          adminNotes: adminNotes || "Payment manually verified by admin",
          confirmedByAdmin: true,
          confirmedAt: now,
          invoiceNumber,
          invoiceDate: now,
          invoiceUrl: `/invoice/${profile.profileId}`,
        },
      });

      // 2. Make Profile Live
      await tx.profile.update({
        where: { id: profile.id },
        data: {
          paymentCompleted: true,
          isVisible: true,
          approvalStatus: "APPROVED",
          approvedAt: now,
        },
      });

      return payment;
    });

    return NextResponse.json({
      success: true,
      message: `Payment of ₹${grossAmountNum.toFixed(2)} confirmed successfully. Profile is now LIVE and GST Invoice #${invoiceNumber} has been generated.`,
      paymentId: result.id,
      invoiceNumber: result.invoiceNumber,
      invoiceUrl: `/invoice/${result.id}`,
      gstBreakdown,
    });
  } catch (error: any) {
    console.error("ADMIN CONFIRM PAYMENT ERROR:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to confirm payment." },
      { status: 500 }
    );
  }
}
