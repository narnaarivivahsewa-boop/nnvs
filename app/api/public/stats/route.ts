import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [girls, boys, total] = await Promise.all([
      prisma.profile.count({
        where: {
          isVisible: true,
          OR: [
            { paymentCompleted: true },
            { approvalStatus: "APPROVED" },
          ],
          user: {
            gender: "FEMALE",
          },
        },
      }),

      prisma.profile.count({
        where: {
          isVisible: true,
          OR: [
            { paymentCompleted: true },
            { approvalStatus: "APPROVED" },
          ],
          user: {
            gender: "MALE",
          },
        },
      }),

      prisma.profile.count({
        where: {
          isVisible: true,
          OR: [
            { paymentCompleted: true },
            { approvalStatus: "APPROVED" },
          ],
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      girls,
      boys,
      total,
    });
  } catch (error) {
    console.error("PUBLIC STATS API ERROR =>", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}