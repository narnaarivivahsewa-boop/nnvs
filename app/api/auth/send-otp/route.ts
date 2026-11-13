import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOTPExpiry, hashOTP, maskMobileNumber } from "@/lib/auth/otp";
import { sendFast2SmsOTP } from "@/lib/sms/fast2sms";

// In-memory IP rate limiter (Sliding window: Max 10 requests per 10 minutes per IP)
const ipRequestTimestamps = new Map<string, number[]>();

function checkIpRateLimit(ip: string): { allowed: boolean; remainingSec: number } {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxRequests = 10;

  if (ipRequestTimestamps.size > 2000) {
    for (const [key, times] of ipRequestTimestamps.entries()) {
      const valid = times.filter((t) => now - t < windowMs);
      if (valid.length === 0) ipRequestTimestamps.delete(key);
      else ipRequestTimestamps.set(key, valid);
    }
  }

  const timestamps = (ipRequestTimestamps.get(ip) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxRequests) {
    const oldest = timestamps[0];
    const remainingSec = Math.ceil((oldest + windowMs - now) / 1000);
    return { allowed: false, remainingSec: Math.max(remainingSec, 1) };
  }

  timestamps.push(now);
  ipRequestTimestamps.set(ip, timestamps);
  return { allowed: true, remainingSec: 0 };
}

export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown-ip";

    // 0. IP Rate Limiting
    const ipCheck = checkIpRateLimit(clientIp);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many requests from this network. Please wait ${ipCheck.remainingSec} seconds.`,
        },
        { status: 429 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    const rawMobile = String(
      body.mobile ?? body.phoneNumber ?? body.phone ?? ""
    ).trim();
    const cleanMobile = rawMobile.replace(/\D/g, "").slice(-10);

    const otpType =
      String(body.type ?? "LOGIN").trim().toUpperCase() === "REGISTRATION"
        ? "REGISTRATION"
        : "LOGIN";

    // ===========================
    // 1. Validate 10-Digit Mobile
    // ===========================
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      const msg = "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).";
      return NextResponse.json(
        {
          success: false,
          error: msg,
          message: msg,
        },
        { status: 400 }
      );
    }

    const mobileVariants = [
      cleanMobile,
      `+91${cleanMobile}`,
      `91${cleanMobile}`,
      `0${cleanMobile}`,
    ];

    // ===========================
    // 2. Registration Check
    // ===========================
    if (otpType === "REGISTRATION") {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { mobile: { in: mobileVariants } },
            { mobile: { contains: cleanMobile } },
          ],
        },
      });

      if (existingUser) {
        const msg = "This mobile number is already registered. Please login.";
        return NextResponse.json(
          {
            success: false,
            error: msg,
            message: msg,
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
            { mobile: { in: mobileVariants } },
            { mobile: { contains: cleanMobile } },
            { profiles: { some: { phoneNumbers: { some: { phone: { in: mobileVariants } } } } } },
          ],
        },
      });

      const { isPermanentAdmin } = await import("@/lib/admin-auth");
      if (!existingUser && isPermanentAdmin(cleanMobile)) {
        try {
          existingUser = await prisma.user.create({
            data: {
              mobile: cleanMobile,
              fullName: cleanMobile === "9577540005" ? "Rahul Dhamija" : "NNVS Admin",
              role: "ADMIN",
              status: "ACTIVE",
              mobileVerified: true,
            },
          });
        } catch {
          existingUser = {
            id: `admin-${cleanMobile}`,
            mobile: cleanMobile,
            role: "ADMIN",
            status: "ACTIVE",
          } as any;
        }
      }

      if (!existingUser) {
        const msg = "Your mobile number is not registered. Please register first.";
        return NextResponse.json(
          {
            success: false,
            notRegistered: true,
            error: msg,
            message: msg,
          },
          { status: 404 }
        );
      }

      if (existingUser.status === "BLOCKED" || existingUser.status === "DELETED") {
        const msg = "Your account is currently suspended. Please contact RishteClub support.";
        return NextResponse.json(
          {
            success: false,
            error: msg,
            message: msg,
          },
          { status: 403 }
        );
      }
    }

    // ===========================
    // 4. Rate Limiting & Cooldown (30-60s)
    // ===========================
    const now = new Date();
    const lastPendingOtp = await prisma.oTP.findFirst({
      where: {
        mobile: cleanMobile,
        type: otpType,
        verified: false,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });

    if (lastPendingOtp) {
      const secondsSinceLastOtp = (Date.now() - new Date(lastPendingOtp.createdAt).getTime()) / 1000;
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
    // 5. Send OTP via Fast2SMS Smart OTP Gateway
    // ===========================
    const smsResult = await sendFast2SmsOTP(cleanMobile);

    if (!smsResult.success) {
      console.error("Fast2SMS send SMS OTP failed:", smsResult.error);
      return NextResponse.json(
        {
          success: false,
          message: smsResult.error || "Unable to send SMS OTP. Please try again.",
        },
        { status: 502 }
      );
    }

    const expiresAt = getOTPExpiry();

    // ===========================
    // 6. Save Fresh OTP Record in DB (Atomically replace unverified/expired OTPs)
    // ===========================
    const storedOtpCode =
      smsResult.routeUsed !== "SMART_OTP" && smsResult.otp
        ? hashOTP(smsResult.otp)
        : smsResult.requestId?.startsWith("FAST2SMS_")
        ? smsResult.requestId
        : `FAST2SMS_${smsResult.requestId || "OTP"}`;

    const cleanupNow = new Date();
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.oTP.deleteMany({
        where: {
          mobile: cleanMobile,
          type: otpType,
          OR: [
            { verified: false },
            ...(otpType === "LOGIN"
              ? [{ expiresAt: { lt: cleanupNow } }]
              : [{ createdAt: { lt: twoHoursAgo } }]),
          ],
        },
      }),
      prisma.oTP.create({
        data: {
          mobile: cleanMobile,
          code: storedOtpCode,
          type: otpType,
          expiresAt,
          verified: false,
        },
      }),
    ]);

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