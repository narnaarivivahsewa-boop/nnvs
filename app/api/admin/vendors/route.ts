import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        user: true,
        galleries: true,
        reviews: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      vendors,
    });
  } catch (error: any) {
    console.error("VENDORS API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch vendors.",
      },
      {
        status: 500,
      }
    );
  }
}