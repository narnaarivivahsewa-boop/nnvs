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

    const importedProfiles = await prisma.profile.findMany({
      where: {
        AND: [
          {
            OR: [
              { source: "GOOGLE_FORM" },
              { source: "GOOGLE_SHEET" },
              { legacyProfileId: { not: null } },
            ],
          },
          ...(search
            ? [
                {
                  OR: [
                    { profileId: { contains: search, mode: "insensitive" as const } },
                    { legacyProfileId: { contains: search, mode: "insensitive" as const } },
                    { firstName: { contains: search, mode: "insensitive" as const } },
                    { lastName: { contains: search, mode: "insensitive" as const } },
                    { user: { fullName: { contains: search, mode: "insensitive" as const } } },
                    { user: { mobile: { contains: search } } },
                  ],
                },
              ]
            : []),
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
        photos: {
          select: {
            id: true,
            imageUrl: true,
            isPrimary: true,
          },
        },
        education: {
          select: {
            highestQualification: true,
            college: true,
          },
        },
        occupation: {
          select: {
            profession: true,
            company: true,
            annualIncome: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      profiles: importedProfiles,
      totalCount: importedProfiles.length,
    });
  } catch (error) {
    console.error("ADMIN GOOGLE FORMS API ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch imported profiles." },
      { status: 500 }
    );
  }
}
