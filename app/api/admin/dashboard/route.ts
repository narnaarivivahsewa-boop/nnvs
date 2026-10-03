import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const [
      totalProfiles,
      liveProfiles,
      hiddenProfiles,
      todayRegistrations,
      pendingPayments,
      confirmedPayments,
      pendingApprovals,
      duplicateFlags,
      invoicesGenerated,
      googleFormImports,
      recentProfiles,
      recentPayments,
    ] = await Promise.all([
      // 1. Total Profiles
      prisma.profile.count(),

      // 2. Live Profiles
      prisma.profile.count({
        where: { isVisible: true },
      }),

      // 3. Hidden Profiles
      prisma.profile.count({
        where: { isVisible: false },
      }),

      // 4. Today's Registrations
      prisma.user.count({
        where: {
          role: "MEMBER",
          createdAt: { gte: todayMidnight },
        },
      }),

      // 5. Pending Payments
      prisma.profile.count({
        where: { paymentCompleted: false },
      }),

      // 6. Confirmed Payments
      prisma.payment.count({
        where: { status: "SUCCESS" },
      }),

      // 7. Pending Approvals
      prisma.profile.count({
        where: {
          approvalStatus: {
            in: ["UNDER_REVIEW", "DRAFT", "PAYMENT_PENDING"],
          },
        },
      }),

      // 8. Duplicate Flags
      prisma.profile.count({
        where: { isDuplicateFlagged: true },
      }),

      // 9. Invoices Generated
      prisma.payment.count({
        where: {
          invoiceNumber: { not: null },
        },
      }),

      // 10. Google Form Imported Profiles
      prisma.profile.count({
        where: { source: "GOOGLE_FORM" },
      }),

      // 11. Recent Profiles
      prisma.profile.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          user: {
            select: { fullName: true, mobile: true, gender: true },
          },
        },
      }),

      // 12. Recent Confirmed Payments
      prisma.payment.findMany({
        where: { status: "SUCCESS" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          user: {
            select: { fullName: true, mobile: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      dashboard: {
        totalProfiles,
        liveProfiles,
        hiddenProfiles,
        todayRegistrations,
        pendingPayments,
        confirmedPayments,
        pendingApprovals,
        duplicateFlags,
        invoicesGenerated,
        googleFormImports,
        recentProfiles,
        recentPayments,
      },
    });
  } catch (error: any) {
    console.error("ADMIN DASHBOARD API ERROR =>", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}
