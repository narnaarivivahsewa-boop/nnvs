import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            mobile: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error: any) {
    console.error("PAYMENT API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch payments.",
      },
      {
        status: 500,
      }
    );
  }
}