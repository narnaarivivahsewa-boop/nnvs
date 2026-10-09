import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP, getOTPExpiry, hashOTP, maskMobileNumber } from "@/lib/auth/otp";
import { sendTwoFactorSMS } from "@/lib/sms/twofactor";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const rawMobile = String(body.mobile ?? "").trim();
    const cleanMobile = rawMobile.replace(/\D/g, "").slice(-10);

    const otpType =
      body.type === "REGISTRATION"
        ? "REGISTRATION"
        : "LOGIN";

    // ===========================
    // 1. Validate 10-Digit Mobile
    // ===========================
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).",
        },
        { status: 400 }
      );
    }

    // ===========================
    // 2. Registration Check
    // ===========================
    if (otpType === "REGISTRATION") {
      const existingUser = await prisma.user.findUnique({
        where: {
          mobile: cleanMobile,
        },
      });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            message: "This mobile number is already registered. Please login.",
          },
          { status: 400 }
        );
      }
    }

    // ===========================
    // 3. Login Check & Auto Admin
    // ===========================
    if (otpType === "LOGIN") {
      let existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { mobile: cleanMobile },
            { profile: { phoneNumbers: { some: { phone: cleanMobile } } } },
          ],
        },
      });

      const { isPermanentAdmin } = await import("@/lib/admin-auth");
      if (!existingUser && isPermanentAdmin(cleanMobile)) {
        existingUser = await prisma.user.create({
          data: {
            mobile: cleanMobile,
            fullName: cleanMobile === "9577540005" ? "Rahul Dhamija" : "NNVS Admin",
            role: "ADMIN",
            status: "ACTIVE",
            mobileVerified: true,
          },
        });
      }

      if (!existingUser) {
        return NextResponse.json(
          {
            success: false,
            notRegistered: true,
            message: "Your mobile number is not registered. Please register first.",
          },
          { status: 404 }
        );
      }
    }

    // ===========================
    // 4. Rate Limiting & Cooldown (30-60s)
    // ===========================
    const lastOtp = await prisma.oTP.findFirst({
      where: { mobile: cleanMobile },
      orderBy: { createdAt: "desc" },
    });

    if (lastOtp) {
      const secondsSinceLastOtp = (Date.now() - new Date(lastOtp.createdAt).getTime()) / 1000;
      if (secondsSinceLastOtp < 30) {
        const remaining = Math.ceil(30 - secondsSinceLastOtp);
        return NextResponse.json(
          {
            success: false,
            message: `Please wait ${remaining} seconds before requesting a new SMS OTP.`,
            cooldownRemaining: remaining,
          },
          { status: 429 }
        );
      }
    }

    // Hourly Limit: Max 8 OTPs per mobile per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourlyCount = await prisma.oTP.count({
      where: {
        mobile: cleanMobile,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (hourlyCount >= 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many OTP requests for this number. Please try again after 1 hour.",
        },
        { status: 429 }
      );
    }

    // ===========================
    // 5. Generate 6-Digit OTP & Send Strictly via SMS
    // ===========================
    const otp = generateOTP();

    const smsResult = await sendTwoFactorSMS(cleanMobile, otp);

    if (!smsResult.success) {
      console.error("2Factor send SMS OTP failed:", smsResult.error);
      return NextResponse.json(
        {
          success: false,
          message: smsResult.error || "Unable to send SMS OTP. Please try again.",
        },
        { status: 502 }
      );
    }

    const hashedOTP = hashOTP(otp);
    const expiresAt = getOTPExpiry();

    // ===========================
    // 6. Save Hashed OTP in DB
    // ===========================
    await prisma.oTP.deleteMany({
      where: {
        mobile: cleanMobile,
        verified: false,
      },
    });

    await prisma.oTP.create({
      data: {
        mobile: cleanMobile,
        code: hashedOTP,
        type: otpType,
        expiresAt,
        verified: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: `OTP sent via SMS to +91 ${maskMobileNumber(cleanMobile)}.`,
      maskedMobile: `+91 ${maskMobileNumber(cleanMobile)}`,
    });
  } catch (error) {
    console.error("Send OTP Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while sending OTP. Please try again.",
      },
      { status: 500 }
    );
  }
}