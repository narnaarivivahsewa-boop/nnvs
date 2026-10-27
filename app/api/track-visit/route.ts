import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawPath = String(body.path || "/").trim();
    const referer = String(body.referer || req.headers.get("referer") || "").slice(0, 500);
    const clientVisitorId = String(body.visitorId || "").trim().slice(0, 100);

    // Filter out internal / admin routes & api calls
    if (
      rawPath.startsWith("/admin") ||
      rawPath.startsWith("/api") ||
      rawPath.startsWith("/_next") ||
      rawPath.includes("favicon")
    ) {
      return NextResponse.json({ success: true, ignored: true });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = (req.headers.get("user-agent") || "unknown").slice(0, 500);

    // Exclude well-known automated crawlers if desired
    const isBot = /bot|spider|crawl|slurp|headless/i.test(userAgent);

    // Compute today's date in IST (Asia/Kolkata)
    const istDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    // Generate unique session key for today
    const rawIdentifier = clientVisitorId || `${ip}_${userAgent.slice(0, 50)}`;
    const visitorKey = `${istDate}:${rawIdentifier}`;

    let isNewVisit = false;

    if (!isBot) {
      try {
        await prisma.visitorSession.create({
          data: {
            visitorKey,
            date: istDate,
            ipAddress: ip,
            userAgent,
            path: rawPath.slice(0, 255),
            referer: referer || null,
          },
        });
        isNewVisit = true;
      } catch (err: any) {
        // Unique constraint violation (P2002) means this visitor has already visited today
        if (err?.code !== "P2002") {
          console.warn("VisitorSession log notice:", err?.message || err);
        }
      }

      // Upsert DailyVisitorStat
      await prisma.dailyVisitorStat.upsert({
        where: { date: istDate },
        create: {
          date: istDate,
          visits: isNewVisit ? 1 : 0,
          pageviews: 1,
        },
        update: {
          visits: isNewVisit ? { increment: 1 } : undefined,
          pageviews: { increment: 1 },
        },
      });
    }

    return NextResponse.json({
      success: true,
      date: istDate,
      isNewVisit,
    });
  } catch (error: any) {
    console.error("Traffic tracker error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to record visit" },
      { status: 500 }
    );
  }
}
