import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.count();

    return NextResponse.json({
      success: true,
      totalUsers: users,
    });
  } catch (error) {
    console.error("AUTH REGISTER STATS ERROR =>", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch user count." },
      { status: 500 }
    );
  }
}