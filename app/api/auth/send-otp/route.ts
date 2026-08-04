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

    const otpType =
      body.type === "REGISTRATION"
        ? "REGISTRATION"
        : "LOGIN";

    // ===========================
    // Validate Mobile
    // ===========================

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid mobile number.",
        },
        {
          status: 400,
        }
      );
    }

    // ===========================
    // Registration Check
    // ===========================

    if (otpType === "REGISTRATION") {
      const existingUser = await prisma.user.findUnique({
        where: {
          mobile,
        },
      });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            message: "Mobile number already registered.",
          },
          {
            status: 400,
          }
        );
      }
    }

    // ===========================
    // Login Check
    // ===========================

    if (otpType === "LOGIN") {
      const existingUser = await prisma.user.findUnique({
        where: {
          mobile,
        },
      });

      if (!existingUser) {
        return NextResponse.json(
          {
            success: false,
            message: "Mobile number not registered.",
          },
          {
            status: 404,
          }
        );
      }
    }

    // ===========================
    // Generate OTP
    // ===========================

    const otp = generateOTP();

    const hashedOTP = hashOTP(otp);

    const expiresAt = getOTPExpiry();

    // ===========================
    // Delete Old OTPs
    // ===========================

    await prisma.oTP.deleteMany({
      where: {
        mobile,
      },
    });

    // ===========================
    // Save OTP
    // ===========================

    await prisma.oTP.create({
      data: {
        mobile,
        code: hashedOTP,
        type: otpType,
        expiresAt,
        verified: false,
      },
    });

    // ===========================
    // Development OTP
    // ===========================

    printDevelopmentOTP(mobile, otp);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully.",
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