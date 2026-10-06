import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { BUSINESS_INFO, calculateGstFromGross } from "@/lib/gst";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "ALL"; // ALL | PENDING | SUCCESS
    const search = searchParams.get("search")?.trim() || "";

    // 1. Confirmed Payments Query
    let confirmedPayments: any[] = [];
    if (status === "ALL" || status === "SUCCESS" || status === "CONFIRMED") {
      confirmedPayments = await prisma.payment.findMany({
        where: {
          status: "SUCCESS",
          ...(search
            ? {
                OR: [
                  { transactionId: { contains: search, mode: "insensitive" } },
                  { invoiceNumber: { contains: search, mode: "insensitive" } },
                  { user: { fullName: { contains: search, mode: "insensitive" } } },
                  { user: { mobile: { contains: search } } },
                ],
              }
            : {}),
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              mobile: true,
              email: true,
              gender: true,
              profile: {
                select: {
                  id: true,
                  profileId: true,
                  legacyProfileId: true,
                  source: true,
                  isVisible: true,
                  approvalStatus: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    // 2. Pending / Unrecorded Profiles Query (profiles without a SUCCESS Payment record OR paymentCompleted = false)
    let pendingProfiles: any[] = [];
    if (status === "ALL" || status === "PENDING") {
      const searchFilter = search
        ? {
            OR: [
              { profileId: { contains: search, mode: "insensitive" as const } },
              { legacyProfileId: { contains: search, mode: "insensitive" as const } },
              { firstName: { contains: search, mode: "insensitive" as const } },
              { lastName: { contains: search, mode: "insensitive" as const } },
              { user: { fullName: { contains: search, mode: "insensitive" as const } } },
              { user: { mobile: { contains: search } } },
            ],
          }
        : {};

      pendingProfiles = await prisma.profile.findMany({
        where: {
          AND: [
            {
              OR: [
                { paymentCompleted: false },
                { user: { payments: { none: { status: "SUCCESS" } } } },
              ],
            },
            searchFilter,
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              mobile: true,
              email: true,
              gender: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return NextResponse.json({
      success: true,
      confirmedCount: confirmedPayments.length,
      pendingCount: pendingProfiles.length,
      confirmedPayments,
      pendingProfiles: pendingProfiles.map((p) => {
        const isFemale = p.user.gender === "FEMALE";
        const expectedFee = isFemale ? BUSINESS_INFO.fees.female : BUSINESS_INFO.fees.male;
        return {
          ...p,
          expectedFee,
        };
      }),
    });
  } catch (error: any) {
    console.error("ADMIN PAYMENTS API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to fetch payments.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const {
      paymentId,
      grossAmount,
      isPaymentExempt = false,
      reason,
      transactionId,
      paymentDate,
      adminNotes,
      isInterstate = false,
    } = body;

    if (!paymentId) {
      return NextResponse.json(
        { success: false, message: "Payment ID is required." },
        { status: 400 }
      );
    }

    if (!reason || String(reason).trim().length < 3) {
      return NextResponse.json(
        { success: false, message: "A clear reason is required for the statutory audit trail." },
        { status: 400 }
      );
    }

    // Find existing payment
    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          include: { profile: true },
        },
      },
    });

    if (!existingPayment) {
      return NextResponse.json(
        { success: false, message: "Payment record not found." },
        { status: 404 }
      );
    }

    const oldGrossAmount = Number(existingPayment.grossAmount || existingPayment.amount || 0);
    const oldTaxableAmount = Number(existingPayment.taxableAmount || 0);
    const oldGstAmount = Number(existingPayment.gstAmount || 0);
    const oldGateway = existingPayment.paymentGateway || "MANUAL_ADMIN_CONFIRMATION";

    const updatedPaymentDate = paymentDate ? new Date(paymentDate) : existingPayment.paymentDate;
    const updatedTransactionId = transactionId !== undefined ? String(transactionId).trim() : existingPayment.transactionId;
    const updatedAdminNotes = adminNotes !== undefined ? String(adminNotes).trim() : existingPayment.adminNotes;

    // Check if admin user exists in DB for foreign key relation
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

    // ==========================================
    // CASE 1: CONVERT TO PAYMENT-EXEMPT (₹0)
    // ==========================================
    if (isPaymentExempt || Number(grossAmount) === 0) {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Update Payment record (Preserve existing invoiceNumber & history, mark PAYMENT_EXEMPT)
        const updated = await tx.payment.update({
          where: { id: paymentId },
          data: {
            amount: 0,
            grossAmount: 0,
            taxableAmount: 0,
            gstAmount: 0,
            gstRate: 0,
            paymentGateway: "PAYMENT_EXEMPT",
            transactionId: updatedTransactionId || existingPayment.transactionId || `EXEMPT_${Date.now()}`,
            paymentDate: updatedPaymentDate,
            adminNotes: updatedAdminNotes || `Payment Exempt: ${reason}`,
          },
        });

        // 2. Ensure Profile remains Live and Approved
        if (existingPayment.user?.profile?.id) {
          await tx.profile.update({
            where: { id: existingPayment.user.profile.id },
            data: {
              paymentCompleted: true,
              isVisible: true,
              approvalStatus: "APPROVED",
            },
          });
        }

        // 3. Create AuditLog entry with full historical snapshot
        await tx.auditLog.create({
          data: {
            userId: validAdminUserId,
            action: "PAYMENT_EXEMPT_MARKED",
            module: "PAYMENT",
            details: JSON.stringify({
              paymentId,
              candidateName: existingPayment.user?.fullName || "Candidate",
              profileId: existingPayment.user?.profile?.profileId || existingPayment.profileId,
              previous: {
                grossAmount: oldGrossAmount,
                taxableAmount: oldTaxableAmount,
                gstAmount: oldGstAmount,
                paymentGateway: oldGateway,
              },
              updated: {
                grossAmount: 0,
                taxableAmount: 0,
                gstAmount: 0,
                paymentGateway: "PAYMENT_EXEMPT",
              },
              preservedInvoiceNumber: existingPayment.invoiceNumber || null,
              reason: String(reason).trim(),
              editedByAdminMobile: auth.user.mobile,
              timestamp: new Date().toISOString(),
            }),
            ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
          },
        });

        return updated;
      });

      return NextResponse.json({
        success: true,
        message: `Payment record updated to Payment-Exempt (₹0). Previous statutory invoice history (${existingPayment.invoiceNumber || "None"}) has been preserved in audit logs.`,
        payment: result,
        isPaymentExempt: true,
      });
    }

    // ==========================================
    // CASE 2: REAL PAID AMOUNT EDIT (> ₹0)
    // ==========================================
    const newGrossAmount = Number(grossAmount);
    if (isNaN(newGrossAmount) || newGrossAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid positive gross amount received (including GST) greater than ₹0, or check 'Mark as No Payment / Payment Exempt'." },
        { status: 400 }
      );
    }

    const gstRateNum = Number(existingPayment.gstRate || 18);
    const newGstBreakdown = calculateGstFromGross(newGrossAmount, gstRateNum, Boolean(isInterstate));

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Payment record with new recalculated monetary values
      const updated = await tx.payment.update({
        where: { id: paymentId },
        data: {
          amount: newGrossAmount,
          grossAmount: newGrossAmount,
          taxableAmount: newGstBreakdown.taxableAmount,
          gstAmount: newGstBreakdown.totalTax,
          gstRate: gstRateNum,
          paymentGateway: oldGateway === "PAYMENT_EXEMPT" ? "MANUAL_ADMIN_CONFIRMATION" : oldGateway,
          transactionId: updatedTransactionId,
          paymentDate: updatedPaymentDate,
          adminNotes: updatedAdminNotes,
        },
      });

      // 2. Create AuditLog entry
      await tx.auditLog.create({
        data: {
          userId: validAdminUserId,
          action: "PAYMENT_AMOUNT_UPDATED",
          module: "PAYMENT",
          details: JSON.stringify({
            paymentId,
            invoiceNumber: existingPayment.invoiceNumber,
            candidateName: existingPayment.user?.fullName || "Candidate",
            profileId: existingPayment.user?.profile?.profileId || existingPayment.profileId,
            previous: {
              grossAmount: oldGrossAmount,
              taxableAmount: oldTaxableAmount,
              gstAmount: oldGstAmount,
              paymentGateway: oldGateway,
            },
            updated: {
              grossAmount: newGrossAmount,
              taxableAmount: newGstBreakdown.taxableAmount,
              gstAmount: newGstBreakdown.totalTax,
              paymentGateway: oldGateway === "PAYMENT_EXEMPT" ? "MANUAL_ADMIN_CONFIRMATION" : oldGateway,
            },
            reason: String(reason).trim(),
            editedByAdminMobile: auth.user.mobile,
            timestamp: new Date().toISOString(),
          }),
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: `Payment updated successfully from ₹${oldGrossAmount.toFixed(2)} to ₹${newGrossAmount.toFixed(2)}. GST breakdown and invoice have been synchronized.`,
      payment: result,
      gstBreakdown: newGstBreakdown,
    });
  } catch (error: any) {
    console.error("ADMIN EDIT PAYMENT ERROR:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to edit payment." },
      { status: 500 }
    );
  }
}