import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const now = new Date();
    // Format dates in IST
    const formatIstDate = (d: Date) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(d);

    const todayStr = formatIstDate(now);

    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = formatIstDate(yesterdayDate);

    // Build the list of last 7 calendar days in IST
    const last7DaysKeys: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      last7DaysKeys.push(formatIstDate(d));
    }

    const [todayStat, yesterdayStat, last7DaysRows, allTimeAggregate, recentSessions] =
      await Promise.all([
        // Today
        prisma.dailyVisitorStat.findUnique({
          where: { date: todayStr },
        }),
        // Yesterday
        prisma.dailyVisitorStat.findUnique({
          where: { date: yesterdayStr },
        }),
        // Last 7 days
        prisma.dailyVisitorStat.findMany({
          where: {
            date: { in: last7DaysKeys },
          },
          orderBy: { date: "asc" },
        }),
        // All time totals
        prisma.dailyVisitorStat.aggregate({
          _sum: {
            visits: true,
            pageviews: true,
          },
        }),
        // Recent 10 public visitor sessions
        prisma.visitorSession.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            date: true,
            path: true,
            referer: true,
            createdAt: true,
          },
        }),
      ]);

    // Map rows to map for quick lookup
    const statsMap = new Map(last7DaysRows.map((r) => [r.date, r]));

    const trend = last7DaysKeys.map((dateKey) => {
      const found = statsMap.get(dateKey);
      const parsedDate = new Date(`${dateKey}T12:00:00Z`);
      const label = parsedDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
      const dayName = parsedDate.toLocaleDateString("en-IN", {
        weekday: "short",
      });

      return {
        date: dateKey,
        label,
        dayName,
        visits: found?.visits || 0,
        pageviews: found?.pageviews || 0,
      };
    });

    const todayVisits = todayStat?.visits || 0;
    const todayPageviews = todayStat?.pageviews || 0;
    const yesterdayVisits = yesterdayStat?.visits || 0;

    const visitDiffPercent =
      yesterdayVisits > 0
        ? Math.round(((todayVisits - yesterdayVisits) / yesterdayVisits) * 100)
        : null;

    return NextResponse.json({
      success: true,
      traffic: {
        todayStr,
        todayVisits,
        todayPageviews,
        yesterdayVisits,
        visitDiffPercent,
        trend,
        allTimeVisits: allTimeAggregate._sum.visits || todayVisits,
        allTimePageviews: allTimeAggregate._sum.pageviews || todayPageviews,
        recentSessions,
      },
    });
  } catch (error: any) {
    console.error("Traffic API Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to load traffic metrics" },
      { status: 500 }
    );
  }
}
