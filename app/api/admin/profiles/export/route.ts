import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "";
    const payment = searchParams.get("payment") || "";
    const gender = searchParams.get("gender") || "";

    const whereClause: any = {};
    if (status) whereClause.approvalStatus = status;
    if (payment === "PAID") whereClause.paymentCompleted = true;
    else if (payment === "PENDING") whereClause.paymentCompleted = false;
    if (gender) whereClause.user = { gender };

    if (search) {
      whereClause.OR = [
        { profileId: { contains: search, mode: "insensitive" } },
        { oldNnvsId: { contains: search, mode: "insensitive" } },
        { legacyProfileId: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { user: { fullName: { contains: search, mode: "insensitive" } } },
        { user: { mobile: { contains: search } } },
      ];
    }

    const profiles = await prisma.profile.findMany({
      where: whereClause,
      include: {
        user: true,
        occupation: true,
        education: true,
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    const headers = [
      "Profile ID",
      "Old NNVS ID",
      "Full Name",
      "Mobile",
      "Gender",
      "Marital Status",
      "Caste",
      "Religion",
      "Approval Status",
      "Payment Completed",
      "Exempted",
      "Profession",
      "Created At",
    ];

    const rows = profiles.map((p) => [
      `"${p.profileId}"`,
      `"${p.oldNnvsId || p.legacyProfileId || ""}"`,
      `"${p.user?.fullName || p.firstName || ""}"`,
      `"${p.user?.mobile || ""}"`,
      `"${p.user?.gender || ""}"`,
      `"${p.maritalStatus || ""}"`,
      `"${p.caste || ""}"`,
      `"${p.religion || ""}"`,
      `"${p.approvalStatus}"`,
      p.paymentCompleted ? "YES" : "NO",
      p.isPaymentExempted ? "YES" : "NO",
      `"${p.occupation?.profession || ""}"`,
      `"${new Date(p.createdAt).toLocaleDateString()}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="NNVS_Profiles_Export_${Date.now()}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("ADMIN PROFILES EXPORT ERROR =>", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Export failed." },
      { status: 500 }
    );
  }
}
