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
    const status = searchParams.get("status") || "ALL"; // ALL | PENDING | SUCCESS
    const search = searchParams.get("search")?.trim() || "";

    // 1. Confirmed Payments Query
    let confirmedPayments: any[] = [];
    if (status === "ALL" || status === "SUCCESS" || status === "CONFIRMED") {
      confirmedPayments = await prisma.payment.findMany({
        where: {
          status: "SUCCESS",
          ...(search
            ? {
                OR: [
                  { transactionId: { contains: search, mode: "insensitive" } },
                  { invoiceNumber: { contains: search, mode: "insensitive" } },
                  { user: { fullName: { contains: search, mode: "insensitive" } } },
                  { user: { mobile: { contains: search } } },
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
              gender: true,
              profile: {
                select: {
                  id: true,
                  profileId: true,
                  legacyProfileId: true,
                  source: true,
                  isVisible: true,
                  approvalStatus: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    // 2. Pending Profiles Query (paymentCompleted = false)
    let pendingProfiles: any[] = [];
    if (status === "ALL" || status === "PENDING") {
      pendingProfiles = await prisma.profile.findMany({
        where: {
          paymentCompleted: false,
          ...(search
            ? {
                OR: [
                  { profileId: { contains: search, mode: "insensitive" } },
                  { legacyProfileId: { contains: search, mode: "insensitive" } },
                  { firstName: { contains: search, mode: "insensitive" } },
                  { lastName: { contains: search, mode: "insensitive" } },
                  { user: { fullName: { contains: search, mode: "insensitive" } } },
                  { user: { mobile: { contains: search } } },
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
              gender: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return NextResponse.json({
      success: true,
      confirmedCount: confirmedPayments.length,
      pendingCount: pendingProfiles.length,
      confirmedPayments,
      pendingProfiles: pendingProfiles.map((p) => {
        const isFemale = p.user.gender === "FEMALE";
        const expectedFee = isFemale ? BUSINESS_INFO.fees.female : BUSINESS_INFO.fees.male;
        return {
          ...p,
          expectedFee,
        };
      }),
    });
  } catch (error: any) {
    console.error("ADMIN PAYMENTS API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to fetch payments.",
      },
      {
        status: 500,
      }
    );
  }
}