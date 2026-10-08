import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/jwt";
import { verifyTwoFactorOTP } from "@/lib/sms/twofactor";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const rawMobile = String(body.mobile ?? "").trim();
    const cleanMobile = rawMobile.replace(/\D/g, "").slice(-10);
    const otp = String(body.otp ?? "").trim();

    const otpType =
      body.type === "REGISTRATION"
        ? "REGISTRATION"
        : "LOGIN";

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid 10-digit mobile number.",
        },
        { status: 400 }
      );
    }

    if (!/^\d{4,6}$/.test(otp)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter the valid OTP received via SMS.",
        },
        { status: 400 }
      );
    }

    const otpRecord = await prisma.oTP.findFirst({
      where: {
        mobile: cleanMobile,
        verified: false,
        type: otpType,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        {
          success: false,
          message: "No pending OTP found. Please click Resend OTP.",
        },
        { status: 404 }
      );
    }

    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: "OTP has expired. Please click Resend OTP to get a new code.",
        },
        { status: 400 }
      );
    }

    // Verify OTP directly via 2Factor Gateway
    const verifyResult = await verifyTwoFactorOTP(cleanMobile, otp, otpRecord.code);

    if (!verifyResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: verifyResult.error || "Incorrect OTP. Please enter the valid code received on SMS.",
        },
        { status: 400 }
      );
    }

    // Mark verified in DB
    await prisma.oTP.update({
      where: {
        id: otpRecord.id,
      },
      data: {
        verified: true,
      },
    });

    let user = await prisma.user.findUnique({
      where: {
        mobile: cleanMobile,
      },
    });

    // Registration Flow
    if (otpType === "REGISTRATION") {
      if (user) {
        return NextResponse.json(
          {
            success: false,
            message: "Mobile number is already registered. Please proceed to login.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Mobile number verified successfully! ✓",
        verified: true,
      });
    }

    // Login Flow
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Account not found with this mobile number.",
        },
        { status: 404 }
      );
    }

    const { isPermanentAdmin } = await import("@/lib/admin-auth");
    const isAdmin = isPermanentAdmin(cleanMobile) || user.role === "ADMIN";

    user = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        mobileVerified: true,
        ...(isAdmin ? { role: "ADMIN", status: "ACTIVE" } : {}),
      },
    });

    const roleToAssign = isAdmin ? "ADMIN" : user.role;

    const token = await generateToken(
      user.id,
      user.mobile,
      roleToAssign
    );

    const response = NextResponse.json({
      success: true,
      message: "OTP verified successfully.",
      userId: user.id,
      role: user.role,
      isNewUser: false,
    });

    response.cookies.set("nnvs_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Verify OTP Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}