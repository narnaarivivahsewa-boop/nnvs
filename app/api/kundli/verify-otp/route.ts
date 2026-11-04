import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashOTP } from "@/lib/auth/otp";
import { calculateKundliMilan } from "@/lib/ashtakoot";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawPhone = String(body.phoneNumber ?? body.phone ?? body.mobile ?? "").trim();
    const cleanPhone = rawPhone.replace(/\D/g, "").slice(-10);
    const userOtp = String(body.otp ?? "").trim();

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid 10-digit Indian mobile number.",
        },
        { status: 400 }
      );
    }

    if (!userOtp || userOtp.length < 4) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide the valid OTP sent to your phone.",
        },
        { status: 400 }
      );
    }

    // 1. Fetch OTP record & match hashed OTP
    const verification = await prisma.otpVerification.findUnique({
      where: { phoneNumber: cleanPhone },
    });

    if (!verification) {
      return NextResponse.json(
        {
          success: false,
          message: "No active OTP request found for this number. Please request a new OTP.",
        },
        { status: 400 }
      );
    }

    if (new Date() > verification.expiresAt) {
      return NextResponse.json(
        {
          success: false,
          message: "The OTP has expired. Please request a new OTP.",
        },
        { status: 400 }
      );
    }

    const hashedInput = hashOTP(userOtp);
    if (hashedInput !== verification.otpHash) {
      return NextResponse.json(
        {
          success: false,
          message: "Incorrect OTP entered. Please check and try again.",
        },
        { status: 400 }
      );
    }

    // OTP is valid - remove consumed OTP record
    await prisma.otpVerification
      .delete({
        where: { phoneNumber: cleanPhone },
      })
      .catch(() => {});

    // 2. Validate submitted partner details
    const boyName = String(body.boyName ?? "Groom").trim() || "Groom";
    const boyDobStr = String(body.boyDob ?? "");
    const boyTime = String(body.boyTime ?? "12:00").trim() || "12:00";
    const boyPlace = String(body.boyPlace ?? "Delhi, India").trim() || "Delhi, India";

    const girlName = String(body.girlName ?? "Bride").trim() || "Bride";
    const girlDobStr = String(body.girlDob ?? "");
    const girlTime = String(body.girlTime ?? "12:00").trim() || "12:00";
    const girlPlace = String(body.girlPlace ?? "Delhi, India").trim() || "Delhi, India";

    const boyDob = boyDobStr ? new Date(boyDobStr) : new Date("1995-01-01");
    const girlDob = girlDobStr ? new Date(girlDobStr) : new Date("1997-01-01");

    // 3. Run calculateKundliMilan with submitted details
    const result = calculateKundliMilan({
      boyName,
      boyDob,
      boyTime,
      boyPlace,
      girlName,
      girlDob,
      girlTime,
      girlPlace,
    });

    // 4. Check if already registered
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { mobile: cleanPhone },
          { profiles: { some: { phoneNumbers: { some: { phone: cleanPhone } } } } },
        ],
      },
    });
    const isRegistered = Boolean(existingUser);

    // 5. Upsert/create KundliLead record with isOtpVerified: true
    const lead = await prisma.kundliLead.create({
      data: {
        phoneNumber: cleanPhone,
        isOtpVerified: true,
        boyName,
        boyDob,
        boyTime,
        boyPlace,
        girlName,
        girlDob,
        girlTime,
        girlPlace,
        gunaScore: result.totalScore,
        manglikStatus: result.manglikAnalysis.status,
        isRegistered,
      },
    });

    // 6. Return response
    return NextResponse.json({
      success: true,
      result,
      verifiedPhone: cleanPhone,
      leadId: lead.id,
      isRegistered,
    });
  } catch (error) {
    console.error("[Kundli Verify OTP Error]:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to verify OTP. Please try again.",
      },
      { status: 500 }
    );
  }
}

