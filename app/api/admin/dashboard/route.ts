import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
  totalMembers,
  maleMembers,
  femaleMembers,
  approvedProfiles,
  pendingProfiles,
  rejectedProfiles,
  totalPayments,
  totalVendors,
  totalInterests,
  todayRegistrations,
] = await Promise.all([

      prisma.user.count({
        where: {
          role: "MEMBER",
        },
      }),
      prisma.user.count({
  where: {
    role: "MEMBER",
    gender: "MALE",
  },
}),

prisma.user.count({
  where: {
    role: "MEMBER",
    gender: "FEMALE",
  },
}),

      prisma.profile.count({
        where: {
          approvalStatus: "APPROVED",
        },
      }),

      prisma.profile.count({
        where: {
          approvalStatus: {
            in: [
              "DRAFT",
              "PAYMENT_PENDING",
              "UNDER_REVIEW",
              "CHANGES_REQUESTED",
            ],
          },
        },
      }),

      prisma.profile.count({
        where: {
          approvalStatus: "REJECTED",
        },
      }),

      prisma.payment.count(),

      prisma.vendor.count(),

      prisma.interest.count(),

      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(
              new Date().setHours(0, 0, 0, 0)
            ),
          },
        },
      }),

    ]);

    return NextResponse.json({
      success: true,

      dashboard: {
  totalMembers,
  maleMembers,
  femaleMembers,
  approvedProfiles,
  pendingProfiles,
  rejectedProfiles,
  totalPayments,
  totalVendors,
  totalInterests,
  todayRegistrations,
},
    });

  } catch (error) {
    console.error(
      "ADMIN DASHBOARD API ERROR =>",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}