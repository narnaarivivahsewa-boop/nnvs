import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { BUSINESS_INFO } from "@/lib/gst";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";

    const paymentsWithInvoices = await prisma.payment.findMany({
      where: {
        status: "SUCCESS",
        invoiceNumber: { not: null },
        ...(search
          ? {
              OR: [
                { invoiceNumber: { contains: search, mode: "insensitive" } },
                { transactionId: { contains: search, mode: "insensitive" } },
                { user: { fullName: { contains: search, mode: "insensitive" } } },
                { user: { mobile: { contains: search } } },
                { user: { profile: { profileId: { contains: search, mode: "insensitive" } } } },
                { user: { profile: { legacyProfileId: { contains: search, mode: "insensitive" } } } },
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
            profile: {
              select: {
                id: true,
                profileId: true,
                legacyProfileId: true,
                firstName: true,
                lastName: true,
                source: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedInvoices = paymentsWithInvoices.map((p) => ({
      id: p.id,
      amount: p.amount,
      grossAmount: p.grossAmount,
      taxableAmount: p.taxableAmount,
      gstAmount: p.gstAmount,
      gstRate: p.gstRate,
      invoiceNumber: p.invoiceNumber,
      invoiceDate: p.invoiceDate,
      transactionId: p.transactionId,
      createdAt: p.createdAt,
      user: {
        id: p.user.id,
        fullName: p.user.fullName,
        mobile: p.user.mobile,
        email: p.user.email,
      },
      profile: p.user.profile || null,
    }));

    return NextResponse.json({
      success: true,
      invoices: formattedInvoices,
      totalCount: formattedInvoices.length,
      businessInfo: BUSINESS_INFO,
    });
  } catch (error: any) {
    console.error("ADMIN INVOICES API ERROR:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch invoices." },
      { status: 500 }
    );
  }
}
