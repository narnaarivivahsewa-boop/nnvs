import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.count();

  return NextResponse.json({
    success: true,
    totalUsers: users,
  });
}