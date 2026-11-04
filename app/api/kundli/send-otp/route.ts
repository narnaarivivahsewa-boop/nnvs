import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP, hashOTP } from "@/lib/auth/otp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawPhone = String(body.phoneNumber ?? body.phone ?? body.mobile ?? "").trim();
    const cleanPhone = rawPhone.replace(/\D/g, "").slice(-10);

    // 1. Validate 10-digit Indian phone (/^[6-9]\d{9}$/)
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        {
          error: "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).",
          message: "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).",
          success: false,
        },
        { status: 400 }
      );
    }

    const now = Date.now();
    const windowMs = 10 * 60 * 1000; // 10 minutes

    // 2. Rate limit to 3 attempts within 10 minutes
    const existing = await prisma.otpVerification.findUnique({
      where: { phoneNumber: cleanPhone },
    });

    if (existing) {
      const elapsed = now - existing.updatedAt.getTime();
      if (elapsed < windowMs && existing.attempts >= 3) {
        const remainingMinutes = Math.max(1, Math.ceil((windowMs - elapsed) / 60000));
        return NextResponse.json(
          {
            error: `Too many OTP requests. Please wait ${remainingMinutes} minute(s) before trying again.`,
            message: `Too many OTP requests. Please wait ${remainingMinutes} minute(s) before trying again.`,
            success: false,
          },
          { status: 429 }
        );
      }
    }

    // 3. Generate OTP, hash with SHA-256 and store in OtpVerification
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(now + windowMs);

    const isNewWindow = !existing || now - existing.updatedAt.getTime() >= windowMs;
    const newAttempts = isNewWindow ? 1 : existing.attempts + 1;

    await prisma.otpVerification.upsert({
      where: { phoneNumber: cleanPhone },
      update: {
        otpHash,
        attempts: newAttempts,
        expiresAt,
      },
      create: {
        phoneNumber: cleanPhone,
        otpHash,
        attempts: 1,
        expiresAt,
      },
    });

    console.log(`[Kundli OTP] Generated OTP for ${cleanPhone}: ${otp}`);

    // 4. Resolve FAST2SMS_API_KEY
    const apiKey = (process.env.FAST2SMS_API_KEY || "").replace(/["']/g, "").trim();

    if (!apiKey) {
      console.error("[Fast2SMS] FAST2SMS_API_KEY is not configured in environment variables.");
      return NextResponse.json(
        {
          error: "SMS service not configured on server. Please check FAST2SMS_API_KEY.",
          message: "SMS service not configured on server. Please check FAST2SMS_API_KEY.",
          success: false,
        },
        { status: 500 }
      );
    }

    // 5. Dispatch via Fast2SMS Bulk V2 OTP route
    const fast2smsRes = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "otp",
        variables_values: otp,
        numbers: cleanPhone,
      }),
    });

    const data = await fast2smsRes.json().catch(() => ({}));
    console.log("Fast2SMS API Response:", data);

    if (!data.return) {
      const errorMsg = Array.isArray(data.message)
        ? data.message[0]
        : (typeof data.message === "string" ? data.message : (data.message?.[0] || "SMS dispatch failed"));
      return NextResponse.json(
        {
          error: errorMsg,
          message: errorMsg,
          success: false,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `OTP has been sent to +91 ${cleanPhone.slice(0, 2)}******${cleanPhone.slice(-2)}.`,
      phoneNumber: cleanPhone,
    });
  } catch (error) {
    console.error("[Kundli Send OTP Error]:", error);
    return NextResponse.json(
      {
        error: "Failed to dispatch OTP. Please try again.",
        message: "Failed to dispatch OTP. Please try again.",
        success: false,
      },
      { status: 500 }
    );
  }
}
