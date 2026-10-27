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
    const filter = (searchParams.get("filter") || "ALL").toUpperCase(); // "ALL" | "ACTIVE" | "PENDING"
    const search = (searchParams.get("search") || "").trim();
    const isExport = searchParams.get("export") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = isExport ? 5000 : Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "25", 10)));
    const skip = isExport ? 0 : (page - 1) * limit;

    // Build Prisma query condition
    const whereCondition: any = {};

    // Filter by adoption status
    if (filter === "ACTIVE") {
      // Active / Logged In: mustChangePassword is false OR has a login record
      whereCondition.user = {
        OR: [
          { mustChangePassword: false },
          { lastLoginAt: { not: null } },
          { loginHistory: { some: {} } },
        ],
      };
    } else if (filter === "PENDING") {
      // Pending / Never Logged In: mustChangePassword is true AND no login recorded
      whereCondition.user = {
        AND: [
          { mustChangePassword: true },
          { lastLoginAt: null },
          { loginHistory: { none: {} } },
        ],
      };
    }

    // Search by profileId, candidate name, or mobile
    if (search) {
      const cleanDigits = search.replace(/\D/g, "");
      const searchTerms: any[] = [
        { profileId: { contains: search, mode: "insensitive" } },
        { oldNnvsId: { contains: search, mode: "insensitive" } },
        { legacyProfileId: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { user: { fullName: { contains: search, mode: "insensitive" } } },
      ];

      if (cleanDigits.length >= 3) {
        searchTerms.push({ user: { mobile: { contains: cleanDigits } } });
        searchTerms.push({ phoneNumbers: { some: { phone: { contains: cleanDigits } } } });
      }

      if (whereCondition.user) {
        whereCondition.AND = [
          { user: whereCondition.user },
          { OR: searchTerms },
        ];
        delete whereCondition.user;
      } else {
        whereCondition.OR = searchTerms;
      }
    }

    // Metrics calculation (independent of pagination/filters)
    const [
      totalRegisteredProfiles,
      totalActiveProfiles,
      totalPendingProfiles,
      totalCount,
      profiles,
    ] = await Promise.all([
      // Total registered profiles
      prisma.profile.count(),

      // Total Active Profiles (User has logged in OR password changed)
      prisma.profile.count({
        where: {
          user: {
            OR: [
              { mustChangePassword: false },
              { lastLoginAt: { not: null } },
              { loginHistory: { some: {} } },
            ],
          },
        },
      }),

      // Total Pending Profiles (Never Logged In / Password Not Updated)
      prisma.profile.count({
        where: {
          user: {
            AND: [
              { mustChangePassword: true },
              { lastLoginAt: null },
              { loginHistory: { none: {} } },
            ],
          },
        },
      }),

      // Count for current filtered view
      prisma.profile.count({ where: whereCondition }),

      // Paginated or Export rows
      prisma.profile.findMany({
        where: whereCondition,
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: limit,
        select: {
          id: true,
          profileId: true,
          legacyProfileId: true,
          oldNnvsId: true,
          firstName: true,
          lastName: true,
          source: true,
          paymentCompleted: true,
          approvalStatus: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              fullName: true,
              mobile: true,
              email: true,
              gender: true,
              mustChangePassword: true,
              lastLoginAt: true,
              status: true,
              createdAt: true,
              loginHistory: {
                take: 1,
                orderBy: { loginAt: "desc" },
                select: { loginAt: true, ipAddress: true, device: true },
              },
            },
          },
        },
      }),
    ]);

    // Format rows
    const formattedProfiles = profiles.map((p) => {
      const candidateName =
        p.user?.fullName ||
        [p.firstName, p.lastName].filter(Boolean).join(" ") ||
        "Unnamed Candidate";

      const cleanMobile = (p.user?.mobile || "").replace(/\D/g, "").slice(-10);
      const isPasswordChanged = !p.user?.mustChangePassword;
      const latestLogin = p.user?.lastLoginAt || p.user?.loginHistory?.[0]?.loginAt || null;

      const isPending =
        Boolean(p.user?.mustChangePassword) && !latestLogin;

      return {
        id: p.id,
        profileId: p.profileId,
        legacyProfileId: p.legacyProfileId,
        candidateName,
        mobile: cleanMobile,
        gender: p.user?.gender || null,
        lastLoginDate: latestLogin ? new Date(latestLogin).toISOString() : null,
        passwordChanged: isPasswordChanged,
        isPending,
        source: p.source || "WEBSITE",
        paymentCompleted: p.paymentCompleted,
        approvalStatus: p.approvalStatus,
        registeredAt: p.createdAt.toISOString(),
      };
    });

    // If client requested direct CSV stream/download
    if (isExport && searchParams.get("format") === "csv") {
      const headers = [
        "Profile ID",
        "Candidate Name",
        "Mobile Number",
        "Gender",
        "Last Login Date",
        "Password Changed",
        "Status",
        "Source",
        "Registered Date",
      ];

      const csvRows = formattedProfiles.map((item) => {
        const lastLogin = item.lastLoginDate
          ? new Date(item.lastLoginDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Never Logged In";

        return [
          `"${item.profileId}"`,
          `"${item.candidateName.replace(/"/g, '""')}"`,
          `"${item.mobile}"`, // 10-digit mobile number ready for Fast2SMS / WhatsApp
          `"${item.gender || "N/A"}"`,
          `"${lastLogin}"`,
          `"${item.passwordChanged ? "Yes" : "No"}"`,
          `"${item.isPending ? "Pending" : "Active"}"`,
          `"${item.source}"`,
          `"${new Date(item.registeredAt).toLocaleDateString("en-IN")}"`,
        ].join(",");
      });

      const csvContent = [headers.join(","), ...csvRows].join("\r\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="NNVS-${filter}-Adoption-List-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      metrics: {
        totalRegisteredProfiles,
        totalActiveProfiles,
        totalPendingProfiles,
        adoptionRatePercent:
          totalRegisteredProfiles > 0
            ? Math.round((totalActiveProfiles / totalRegisteredProfiles) * 100)
            : 0,
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
      profiles: formattedProfiles,
    });
  } catch (error: any) {
    console.error("User Activity API Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch user activity" },
      { status: 500 }
    );
  }
}
