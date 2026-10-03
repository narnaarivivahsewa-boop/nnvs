import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BUSINESS_INFO, calculateGstBreakdown, numberToWordsINR } from "@/lib/gst";

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

    // Try finding by Payment ID
    let payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    // If not found by Payment ID, check if it was requested with profileId
    if (!payment) {
      const profile = await prisma.profile.findUnique({
        where: { profileId: id },
        include: {
          user: {
            include: {
              payments: {
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

    if (!payment) {
      return NextResponse.json(
        { success: false, message: "Invoice / Payment record not found." },
        { status: 404 }
      );
    }

    const totalAmountNum = Number(payment.amount);
    // Reverse-calculate taxable base assuming standard 18% GST if not separately stored
    const taxableBase = Math.round((totalAmountNum / (1 + BUSINESS_INFO.fees.gstRate)) * 100) / 100;
    const taxes = calculateGstBreakdown(taxableBase);
    const amountInWords = numberToWordsINR(totalAmountNum);

    // Format serial invoice number: TT/YYYY-YY/INV-<ShortID>
    const invoiceYear = new Date(payment.createdAt).getFullYear();
    const invoiceFinancialYear = `${invoiceYear}-${(invoiceYear + 1).toString().slice(-2)}`;
    const invoiceNumber = `TT/${invoiceFinancialYear}/INV-${payment.id.slice(-6).toUpperCase()}`;

    const invoiceData = {
      invoiceNumber,
      invoiceDate: payment.createdAt,
      status: payment.status,
      transactionId: payment.transactionId || "N/A",
      paymentGateway: payment.paymentGateway || "Online",
      
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
        helplineNumbers: BUSINESS_INFO.helplineNumbers,
        callingHours: BUSINESS_INFO.callingHours,
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
        state: "Haryana", // default intra-state supply unless provided
      },

      // Line items
      item: {
        description: `Matrimonial Matchmaking & Profile Registration Service (${BUSINESS_INFO.brandName} - ${BUSINESS_INFO.managedByFull})`,
        sacCode: BUSINESS_INFO.sacCode,
        sacDescription: BUSINESS_INFO.sacDescription,
        taxableAmount: taxes.taxableAmount,
        cgstRate: `${(taxes.cgstRate * 100).toFixed(0)}%`,
        cgstAmount: taxes.cgstAmount,
        sgstRate: `${(taxes.sgstRate * 100).toFixed(0)}%`,
        sgstAmount: taxes.sgstAmount,
        igstRate: `${(taxes.igstRate * 100).toFixed(0)}%`,
        igstAmount: taxes.igstAmount,
        totalTax: taxes.totalTax,
        totalAmount: totalAmountNum,
        amountInWords,
      },

      declaration: "This is a computer-generated tax invoice issued by Trendy Traders for RishteClub (Managed by NNVS Matrimony). Authorized electronically.",
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
