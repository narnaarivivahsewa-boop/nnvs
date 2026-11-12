import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { calculateGstFromGross } from "@/lib/gst";
import { getRegistrationFee } from "@/lib/pricing";

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
              profiles: {
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
      confirmedPayments: confirmedPayments.map((cp) => ({
        ...cp,
        user: cp.user
          ? {
              ...cp.user,
              profile: cp.user.profiles?.[0] || null,
            }
          : null,
      })),
      pendingProfiles: pendingProfiles.map((p) => {
        const isFemale = p.user?.gender === "FEMALE";
        const expectedFee = getRegistrationFee(isFemale ? "FEMALE" : "MALE");
        return {
          ...p,
          expectedFee,
        };
      }),
    });
  } catch (error) {
    console.error("ADMIN PAYMENTS API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch payments.",
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
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload." },
        { status: 400 }
      );
    }

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

    // Find existing payment (omit password from user select)
    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            profiles: {
              select: {
                id: true,
                profileId: true,
              },
            },
          },
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

    let updatedPaymentDate = existingPayment.paymentDate;
    if (paymentDate) {
      const parsedDate = new Date(paymentDate);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { success: false, message: "Invalid payment date provided." },
          { status: 400 }
        );
      }
      updatedPaymentDate = parsedDate;
    }

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
    if (isPaymentExempt || (grossAmount !== undefined && Number(grossAmount) === 0)) {
      const targetProfile = existingPayment.user?.profiles?.[0];
      const txOps: any[] = [
        // 1. Update Payment record (Preserve existing invoiceNumber & history, mark PAYMENT_EXEMPT)
        prisma.payment.update({
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
        }),
      ];

      // 2. Ensure Profile remains Live and Approved
      if (targetProfile?.id) {
        txOps.push(
          prisma.profile.update({
            where: { id: targetProfile.id },
            data: {
              paymentCompleted: true,
              isPaymentExempted: true,
              paymentExemptionReason: reason || "Admin exemption",
              isVisible: true,
              approvalStatus: "APPROVED",
            },
          })
        );
      }

      // 3. Create AuditLog entry with full historical snapshot
      txOps.push(
        prisma.auditLog.create({
          data: {
            userId: validAdminUserId,
            action: "PAYMENT_EXEMPT_MARKED",
            module: "PAYMENT",
            details: JSON.stringify({
              paymentId,
              candidateName: existingPayment.user?.fullName || "Candidate",
              profileId: targetProfile?.profileId || existingPayment.profileId,
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
        })
      );

      const [updatedPayment] = await prisma.$transaction(txOps);

      return NextResponse.json({
        success: true,
        message: `Payment record updated to Payment-Exempt (₹0). Previous statutory invoice history (${existingPayment.invoiceNumber || "None"}) has been preserved in audit logs.`,
        payment: updatedPayment,
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

    const [updatedPayment] = await prisma.$transaction([
      // 1. Update Payment record with new recalculated monetary values
      prisma.payment.update({
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
      }),
      // 2. Create AuditLog entry
      prisma.auditLog.create({
        data: {
          userId: validAdminUserId,
          action: "PAYMENT_AMOUNT_UPDATED",
          module: "PAYMENT",
          details: JSON.stringify({
            paymentId,
            invoiceNumber: existingPayment.invoiceNumber,
            candidateName: existingPayment.user?.fullName || "Candidate",
            profileId: existingPayment.user?.profiles?.[0]?.profileId || existingPayment.profileId,
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
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Payment updated successfully from ₹${oldGrossAmount.toFixed(2)} to ₹${newGrossAmount.toFixed(2)}. GST breakdown and invoice have been synchronized.`,
      payment: updatedPayment,
      gstBreakdown: newGstBreakdown,
    });
  } catch (error) {
    console.error("ADMIN EDIT PAYMENT ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to edit payment." },
      { status: 500 }
    );
  }
}