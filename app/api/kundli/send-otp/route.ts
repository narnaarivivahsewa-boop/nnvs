import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP, hashOTP } from "@/lib/auth/otp";
import { sendFast2SmsOTP } from "@/lib/sms/fast2sms";

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

    console.log(`[Kundli OTP] Generated local OTP for ${cleanPhone}: ${otp}`);

    // 4. Dispatch OTP via Fast2SMS DLT Gateway (Sender ID: NNVS)
    const smsResult = await sendFast2SmsOTP(cleanPhone, otp);
    console.log("[Fast2SMS] DLT OTP dispatch result:", smsResult);

    if (smsResult.success) {
      return NextResponse.json({
        success: true,
        message: `OTP has been sent to +91 ${cleanPhone.slice(0, 2)}******${cleanPhone.slice(-2)}.`,
        phoneNumber: cleanPhone,
        requestId: smsResult.requestId,
      });
    }

    // Direct DLT fallback if wrapper reported an error
    console.warn("[Fast2SMS] Wrapper returned error, trying direct NNVS DLT fallback:", smsResult.error);

    const apiKey = (process.env.FAST2SMS_API_KEY || "").replace(/["']/g, "").trim();
    if (apiKey) {
      try {
        const senderId = (process.env.FAST2SMS_SENDER_ID || "NNVS").replace(/["']/g, "").trim();
        const entityId = (process.env.FAST2SMS_ENTITY_ID || "1701179249077069314").replace(/["']/g, "").trim();
        const templateId = (process.env.FAST2SMS_DLT_TEMPLATE_ID || process.env.FAST2SMS_TEMPLATE_ID || "").replace(/["']/g, "").trim();

        const dltPayload: {
          route: string;
          sender_id: string;
          entity_id: string;
          message: string;
          numbers: string;
          flash: number;
          template_id?: string;
        } = {
          route: "dlt_manual",
          sender_id: senderId,
          entity_id: entityId,
          message: `RishteClub me login hetu OTP: ${otp}. Valid for 5 mins. Visit: https://rishteclub.com - NNVS MATRIMONY`,
          numbers: cleanPhone,
          flash: 0,
        };

        if (templateId) {
          dltPayload.template_id = templateId;
        }

        const fast2smsRes = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            authorization: apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dltPayload),
        });

        const data = await fast2smsRes.json().catch(() => ({}));
        console.log("Fast2SMS Direct DLT Response:", data);

        if (data && data.return) {
          return NextResponse.json({
            success: true,
            message: `OTP has been sent to +91 ${cleanPhone.slice(0, 2)}******${cleanPhone.slice(-2)}.`,
            phoneNumber: cleanPhone,
            requestId: data.request_id || "NNVS_DLT",
          });
        }
      } catch (fallbackErr) {
        console.error("[Fast2SMS] Direct DLT fallback error:", fallbackErr);
      }
    }

    // If both failed, return a clean user-friendly error message from Fast2SMS
    const errorMsg = smsResult.error || "Failed to send SMS OTP. Please try again.";
    return NextResponse.json(
      {
        error: errorMsg,
        message: errorMsg,
        success: false,
      },
      { status: 400 }
    );
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
