import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BUSINESS_INFO, calculateGstFromGross, numberToWordsINR } from "@/lib/gst";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Invoice / Payment ID is required" },
        { status: 400 }
      );
    }

    // 1. Try finding by Payment ID or invoiceNumber
    let payment = await prisma.payment.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }, { transactionId: id }],
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    // 2. If not found by direct Payment identifier, check if requested with profileId
    if (!payment) {
      const profile = await prisma.profile.findUnique({
        where: { profileId: id },
        include: {
          user: {
            include: {
              payments: {
                where: { status: "SUCCESS" },
                orderBy: { createdAt: "desc" },
                take: 1,
              },
              profile: true,
            },
          },
        },
      });

      if (profile && profile.user.payments.length > 0) {
        payment = {
          ...profile.user.payments[0],
          user: {
            ...profile.user,
            profile,
          },
        } as any;
      }
    }

    // If no payment record exists (e.g. for Google Form imported profiles without payment)
    if (!payment || payment.status !== "SUCCESS") {
      return NextResponse.json(
        {
          success: false,
          message:
            "No GST Tax Invoice is available for this profile. Invoices are generated only after manual admin payment confirmation for paid registrations.",
        },
        { status: 404 }
      );
    }

    // Total gross amount received (authoritative from admin confirmation)
    const grossAmount = Number(payment.grossAmount || payment.amount || 0);
    const gstRateNum = Number(payment.gstRate || 18);

    // Calculate or retrieve GST breakdown
    let taxableAmount = payment.taxableAmount ? Number(payment.taxableAmount) : null;
    let gstAmount = payment.gstAmount ? Number(payment.gstAmount) : null;

    if (taxableAmount === null || gstAmount === null) {
      const breakdown = calculateGstFromGross(grossAmount, gstRateNum, false);
      taxableAmount = breakdown.taxableAmount;
      gstAmount = breakdown.totalTax;
    }

    const halfGst = Math.round((gstAmount / 2) * 100) / 100;
    const amountInWords = numberToWordsINR(grossAmount);

    const invoiceNumber =
      payment.invoiceNumber ||
      `TT/${new Date(payment.createdAt).getFullYear()}-${(
        new Date(payment.createdAt).getFullYear() + 1
      )
        .toString()
        .slice(-2)}/INV-${payment.id.slice(-6).toUpperCase()}`;

    const invoiceDate = payment.invoiceDate || payment.paymentDate || payment.createdAt;

    const invoiceData = {
      invoiceNumber,
      invoiceDate,
      status: payment.status,
      transactionId: payment.transactionId || "N/A",
      paymentGateway: payment.paymentGateway || "Manual / Admin Confirmed",

      // Seller / Supplier (Trendy Traders - GST Registered)
      seller: {
        legalName: BUSINESS_INFO.legalEntityName,
        tradeName: BUSINESS_INFO.tradeName,
        proprietor: BUSINESS_INFO.proprietor,
        gstin: BUSINESS_INFO.gstin,
        stateName: BUSINESS_INFO.stateName,
        stateCode: BUSINESS_INFO.stateCode,
        country: BUSINESS_INFO.country,
        email: BUSINESS_INFO.email,
        primaryWhatsApp: BUSINESS_INFO.primaryWhatsApp,
        contactInstruction: BUSINESS_INFO.contactInstruction,
        brandName: BUSINESS_INFO.brandName,
        managedBy: BUSINESS_INFO.managedBy,
        managedByFull: BUSINESS_INFO.managedByFull,
        domain: BUSINESS_INFO.domain,
      },

      // Buyer / Member
      buyer: {
        name: payment.user.fullName || "Member",
        mobile: payment.user.mobile,
        email: payment.user.email || "N/A",
        profileId: payment.user.profile?.profileId || "N/A",
        state: "Haryana",
      },

      // Line items
      item: {
        description: `Matrimonial Matchmaking & Profile Registration Service (${BUSINESS_INFO.brandName} - ${BUSINESS_INFO.managedByFull})`,
        sacCode: BUSINESS_INFO.sacCode,
        sacDescription: BUSINESS_INFO.sacDescription,
        grossAmountReceived: grossAmount,
        taxableAmount,
        gstRate: `${gstRateNum}%`,
        cgstRate: `${gstRateNum / 2}%`,
        cgstAmount: halfGst,
        sgstRate: `${gstRateNum / 2}%`,
        sgstAmount: gstAmount - halfGst,
        igstRate: `0%`,
        igstAmount: 0,
        totalTax: gstAmount,
        totalAmount: grossAmount,
        amountInWords,
      },

      adminNotes: payment.adminNotes,
      declaration:
        "This is a computer-generated tax invoice issued by Trendy Traders for RishteClub (Managed by NNVS Matrimony). Authorized electronically.",
    };

    return NextResponse.json({
      success: true,
      invoice: invoiceData,
    });
  } catch (error: any) {
    console.error("GET INVOICE ERROR:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to load invoice." },
      { status: 500 }
    );
  }
}
