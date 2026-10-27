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

    const now = new Date();
    const formatIstDate = (d: Date) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(d);

    const todayStr = formatIstDate(now);
    const last7DaysKeys: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      last7DaysKeys.push(formatIstDate(d));
    }

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
      todayVisitorStat,
      last7DaysVisitorRows,
      activeUsersCount,
      pendingUsersCount,
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

      // 13. Visitor stats for today
      prisma.dailyVisitorStat.findUnique({
        where: { date: todayStr },
      }),

      // 14. Visitor stats for last 7 days
      prisma.dailyVisitorStat.findMany({
        where: { date: { in: last7DaysKeys } },
        orderBy: { date: "asc" },
      }),

      // 15. Adoption: Active / Logged in users
      prisma.user.count({
        where: {
          role: "MEMBER",
          OR: [
            { mustChangePassword: false },
            { lastLoginAt: { not: null } },
            { loginHistory: { some: {} } },
          ],
        },
      }),

      // 16. Adoption: Pending / Never logged in users
      prisma.user.count({
        where: {
          role: "MEMBER",
          mustChangePassword: true,
          lastLoginAt: null,
          loginHistory: { none: {} },
        },
      }),
    ]);

    const statsMap = new Map(last7DaysVisitorRows.map((r) => [r.date, r]));
    const trafficTrend = last7DaysKeys.map((dateKey) => {
      const found = statsMap.get(dateKey);
      const parsedDate = new Date(`${dateKey}T12:00:00Z`);
      return {
        date: dateKey,
        label: parsedDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        dayName: parsedDate.toLocaleDateString("en-IN", { weekday: "short" }),
        visits: found?.visits || 0,
        pageviews: found?.pageviews || 0,
      };
    });

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
        traffic: {
          todayStr,
          todayVisits: todayVisitorStat?.visits || 0,
          todayPageviews: todayVisitorStat?.pageviews || 0,
          trend: trafficTrend,
        },
        adoption: {
          totalRegisteredProfiles: totalProfiles,
          activeUsers: activeUsersCount,
          pendingUsers: pendingUsersCount,
        },
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
