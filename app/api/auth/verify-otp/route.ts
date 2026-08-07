import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashOTP } from "@/lib/auth/otp";
import { generateToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const mobile = String(body.mobile ?? "").trim();
    const otp = String(body.otp ?? "").trim();

    const otpType =
      body.type === "REGISTRATION"
        ? "REGISTRATION"
        : "LOGIN";

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid mobile number.",
        },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid OTP.",
        },
        { status: 400 }
      );
    }

    const otpRecord = await prisma.oTP.findFirst({
      where: {
        mobile,
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
          message: "OTP not found.",
        },
        { status: 404 }
      );
    }

    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: "OTP has expired.",
        },
        { status: 400 }
      );
    }

    if (otpRecord.code !== hashOTP(otp)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid OTP.",
        },
        { status: 400 }
      );
    }

    await prisma.oTP.update({
      where: {
        id: otpRecord.id,
      },
      data: {
        verified: true,
      },
    });
    await prisma.oTP.deleteMany({
  where: {
    mobile,
  },
});

    let user = await prisma.user.findUnique({
      where: {
        mobile,
      },
    });

    // Registration Flow
    if (otpType === "REGISTRATION") {
      if (user) {
        return NextResponse.json(
          {
            success: false,
            message: "Mobile number already registered.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "OTP verified successfully.",
      });
    }

    // Login Flow
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Account not found.",
        },
        { status: 404 }
      );
    }

    user = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        mobileVerified: true,
      },
    });

    const token = await generateToken(
  user.id,
  user.mobile,
  user.role
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
      {
        status: 500,
      }
    );
  }
}