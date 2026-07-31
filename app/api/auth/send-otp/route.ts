import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateOTP,
  getOTPExpiry,
  hashOTP,
  printDevelopmentOTP,
} from "@/lib/auth/otp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const mobile = String(body.mobile ?? "").trim();

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid mobile number.",
        },
        { status: 400 }
      );
    }

    const otp = generateOTP();

    const hashedOTP = hashOTP(otp);

    const expiresAt = getOTPExpiry();

    // Delete old OTPs for this mobile
    await prisma.oTP.deleteMany({
      where: {
        mobile,
      },
    });

    // Save new OTP
    await prisma.oTP.create({
      data: {
        mobile,
        code: hashedOTP,
        type: "LOGIN",
        expiresAt,
        verified: false,
      },
    });

    // Print OTP in development mode
    printDevelopmentOTP(mobile, otp);

    return NextResponse.json({
      success: true,
      message: "OTP generated successfully.",
      development: process.env.NODE_ENV === "development",
    });
  } catch (error) {
    console.error("Send OTP Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}