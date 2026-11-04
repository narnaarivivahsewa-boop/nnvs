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
          error: "Please enter a valid 10-digit Indian mobile number.",
          message: "Please enter a valid 10-digit Indian mobile number.",
          success: false,
        },
        { status: 400 }
      );
    }

    if (!userOtp || userOtp.length < 4) {
      return NextResponse.json(
        {
          error: "Please provide the valid OTP sent to your phone.",
          message: "Please provide the valid OTP sent to your phone.",
          success: false,
        },
        { status: 400 }
      );
    }

    // 1. Fetch OTP record & match
    const verification = await prisma.otpVerification.findUnique({
      where: { phoneNumber: cleanPhone },
    });

    if (!verification) {
      return NextResponse.json(
        {
          error: "No active OTP request found for this number. Please request a new OTP.",
          message: "No active OTP request found for this number. Please request a new OTP.",
          success: false,
        },
        { status: 400 }
      );
    }

    if (new Date() > verification.expiresAt) {
      return NextResponse.json(
        {
          error: "The OTP has expired. Please request a new OTP.",
          message: "The OTP has expired. Please request a new OTP.",
          success: false,
        },
        { status: 400 }
      );
    }

    // Verify against Fast2SMS official gateway and local hash fallback
    const { verifyFast2SmsOTP } = await import("@/lib/sms/fast2sms");
    const verifyResult = await verifyFast2SmsOTP(cleanPhone, userOtp);
    const hashedInput = hashOTP(userOtp);
    const isHashValid = hashedInput === verification.otpHash;

    if (!verifyResult.success && !isHashValid) {
      return NextResponse.json(
        {
          error: verifyResult.error || "Incorrect OTP entered. Please check and try again.",
          message: verifyResult.error || "Incorrect OTP entered. Please check and try again.",
          success: false,
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
        error: "Failed to verify OTP. Please try again.",
        message: "Failed to verify OTP. Please try again.",
        success: false,
      },
      { status: 500 }
    );
  }
}
