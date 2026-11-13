import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hashOTP,
  markOtpCodeVerified,
  parseOtpCodeRecord,
  OTP_VERIFY_IDEMPOTENCY_MS,
} from "@/lib/auth/otp";
import {
  generateToken,
  generateRegistrationToken,
  verifyRegistrationToken,
  isSecureCookieRequest,
  sanitizeProfilePhotoUrl,
  AUTH_COOKIE_MAX_AGE,
  REG_VERIFICATION_COOKIE_NAME,
  REG_VERIFICATION_MAX_AGE,
} from "@/lib/jwt";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, no-cache, must-revalidate",
};

export async function GET(req: NextRequest) {
  try {
    const mobileParam = req.nextUrl.searchParams.get("mobile") || "";
    const cleanMobile = mobileParam.replace(/\D/g, "").slice(-10);

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return NextResponse.json(
        { success: false, verified: false, message: "Invalid mobile number." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // Reject if user is already registered
    const existingUser = await prisma.user.findUnique({
      where: { mobile: cleanMobile },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          alreadyRegistered: true,
          message: "Mobile number is already registered. Please proceed to login.",
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    // 1. Check signed registration verification token (cookie or header)
    const tokenFromCookie = req.cookies.get(REG_VERIFICATION_COOKIE_NAME)?.value;
    const tokenFromHeader = req.headers.get("x-reg-token");
    const candidateToken = tokenFromHeader || tokenFromCookie;

    if (candidateToken) {
      try {
        const decoded = await verifyRegistrationToken(candidateToken);
        if (decoded.mobile === cleanMobile) {
          return NextResponse.json(
            {
              success: true,
              verified: true,
              mobile: cleanMobile,
              registrationToken: candidateToken,
            },
            { headers: NO_STORE_HEADERS }
          );
        }
      } catch {
        // Token invalid or expired; continue checking DB
      }
    }

    // 2. Check verified REGISTRATION OTP or verified KundliLead within last 2 hours
    const twoHoursAgo = new Date(Date.now() - REG_VERIFICATION_MAX_AGE * 1000);
    const [verifiedOtp, verifiedLead] = await Promise.all([
      prisma.oTP.findFirst({
        where: {
          mobile: cleanMobile,
          type: "REGISTRATION",
          verified: true,
          createdAt: { gte: twoHoursAgo },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.kundliLead.findFirst({
        where: {
          phoneNumber: cleanMobile,
          isOtpVerified: true,
          createdAt: { gte: twoHoursAgo },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (verifiedOtp || verifiedLead) {
      const registrationToken = await generateRegistrationToken(cleanMobile);
      const res = NextResponse.json(
        {
          success: true,
          verified: true,
          mobile: cleanMobile,
          registrationToken,
        },
        { headers: NO_STORE_HEADERS }
      );
      res.cookies.set(REG_VERIFICATION_COOKIE_NAME, registrationToken, {
        httpOnly: true,
        secure: isSecureCookieRequest(req),
        sameSite: "lax",
        path: "/",
        maxAge: REG_VERIFICATION_MAX_AGE,
      });
      return res;
    }

    return NextResponse.json(
      {
        success: true,
        verified: false,
        mobile: cleanMobile,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("Verify OTP Status Check Error:", error);
    return NextResponse.json(
      { success: false, verified: false, message: "Internal Server Error" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

async function completeOtpVerificationResponse(params: {
  req: NextRequest;
  cleanMobile: string;
  otpType: "REGISTRATION" | "LOGIN";
  recordLoginActivity: boolean;
}) {
  const { req, cleanMobile, otpType, recordLoginActivity } = params;

  // Registration Flow
  if (otpType === "REGISTRATION") {
    const directRegisteredUser = await prisma.user.findUnique({
      where: { mobile: cleanMobile },
      select: { id: true },
    });

    if (directRegisteredUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Mobile number is already registered. Please proceed to login.",
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const registrationToken = await generateRegistrationToken(cleanMobile);
    const regResponse = NextResponse.json(
      {
        success: true,
        message: "Mobile number verified successfully! ✓",
        verified: true,
        mobile: cleanMobile,
        registrationToken,
      },
      { headers: NO_STORE_HEADERS }
    );

    regResponse.cookies.set(REG_VERIFICATION_COOKIE_NAME, registrationToken, {
      httpOnly: true,
      secure: isSecureCookieRequest(req),
      sameSite: "lax",
      path: "/",
      maxAge: REG_VERIFICATION_MAX_AGE,
    });

    return regResponse;
  }

  const mobileVariants = [
    cleanMobile,
    `+91${cleanMobile}`,
    `91${cleanMobile}`,
    `0${cleanMobile}`,
  ];

  let user: any = await prisma.user.findFirst({
    where: {
      OR: [
        { mobile: { in: mobileVariants } },
        { mobile: { contains: cleanMobile } },
        { profiles: { some: { phoneNumbers: { some: { phone: { in: mobileVariants } } } } } },
      ],
    },
  });

  // Login Flow
  const { isPermanentAdmin } = await import("@/lib/admin-auth");
  const isAdmin = isPermanentAdmin(cleanMobile) || (user && user.role === "ADMIN");

  if (!user) {
    if (isAdmin) {
      try {
        user = await prisma.user.create({
          data: {
            mobile: cleanMobile,
            fullName: cleanMobile === "9577540005" ? "Rahul Dhamija" : "NNVS Admin",
            role: "ADMIN",
            status: "ACTIVE",
            mobileVerified: true,
          },
        });
      } catch {
        user = {
          id: `admin-${cleanMobile}`,
          mobile: cleanMobile,
          fullName: cleanMobile === "9577540005" ? "Rahul Dhamija" : "NNVS Admin",
          role: "ADMIN",
          status: "ACTIVE",
        };
      }
    } else {
      const msg = "Account not found with this mobile number.";
      return NextResponse.json(
        {
          success: false,
          error: msg,
          message: msg,
        },
        { status: 404 }
      );
    }
  } else {
    if (!isAdmin && (user.status === "BLOCKED" || user.status === "DELETED")) {
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

    if (recordLoginActivity || !user.mobileVerified || user.status === "PENDING") {
      user = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          mobileVerified: true,
          ...(user.status === "PENDING" ? { status: "ACTIVE" } : {}),
          ...(isAdmin ? { role: "ADMIN", status: "ACTIVE" } : {}),
        },
      });
    }
  }

  const roleToAssign = isAdmin ? "ADMIN" : user.role;

  let profiles: any[] = [];
  let activeProfileId: string | null = null;
  let requiresProfileSelection = false;
  const mustChange = Boolean(user.mustChangePassword);
  let redirectTo = "/dashboard";

  if (mustChange) {
    redirectTo = "/profile/change-password";
  } else if (roleToAssign === "ADMIN") {
    redirectTo = "/admin";
  } else {
    const userProfiles = await prisma.profile.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        profileId: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        paymentCompleted: true,
        approvalStatus: true,
        photos: {
          select: { imageUrl: true, isPrimary: true },
          orderBy: { isPrimary: "desc" },
          take: 1,
        },
        user: {
          select: { gender: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    profiles = userProfiles.map((p) => ({
      id: p.id,
      profileId: p.profileId,
      firstName: p.firstName,
      lastName: p.lastName,
      gender: p.user?.gender || user.gender || null,
      photo: sanitizeProfilePhotoUrl(p.photos?.[0]?.imageUrl, p.profileId),
      dateOfBirth: p.dateOfBirth,
      paymentCompleted: p.paymentCompleted,
      approvalStatus: p.approvalStatus,
    }));

    if (profiles.length === 1) {
      activeProfileId = profiles[0].id;
      redirectTo = !profiles[0].paymentCompleted
        ? `/payment?profileId=${encodeURIComponent(profiles[0].profileId)}&name=${encodeURIComponent(
            user.fullName || ""
          )}&gender=${encodeURIComponent(user.gender || "")}`
        : "/dashboard";
    } else if (profiles.length > 1) {
      requiresProfileSelection = true;
      redirectTo = "/select-profile";
    } else {
      redirectTo = "/dashboard";
    }
  }

  // Record login activity once per OTP verification
  if (recordLoginActivity) {
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const now = new Date();

    await Promise.allSettled([
      prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: now },
      }),
      prisma.loginHistory.create({
        data: {
          userId: user.id,
          ipAddress,
          userAgent,
          device: "Web Browser (OTP)",
          loginAt: now,
        },
      }),
    ]);
  }

  const token = await generateToken(
    user.id,
    user.mobile,
    roleToAssign,
    activeProfileId
  );

  const response = NextResponse.json(
    {
      success: true,
      message: requiresProfileSelection
        ? "Please select which profile to manage."
        : "OTP verified successfully.",
      token,
      maxAge: AUTH_COOKIE_MAX_AGE,
      userId: user.id,
      role: roleToAssign,
      requiresProfileSelection,
      activeProfileId,
      profiles,
      redirectTo,
      mustChangePassword: mustChange,
      isNewUser: false,
    },
    {
      headers: {
        "Cache-Control": "private, no-store, no-cache, must-revalidate",
      },
    }
  );

  const secureCookie = isSecureCookieRequest(req);

  response.cookies.set("nnvs_token", token, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  });

  if (activeProfileId) {
    response.cookies.set("activeProfileId", activeProfileId, {
      httpOnly: false,
      secure: secureCookie,
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE,
    });
  } else if (requiresProfileSelection) {
    response.cookies.set("activeProfileId", "", {
      httpOnly: false,
      secure: secureCookie,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }

  return response;
}

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const rawMobile = String(
      body.mobile ?? body.phoneNumber ?? body.phone ?? ""
    ).trim();
    const cleanMobile = rawMobile.replace(/\D/g, "").slice(-10);
    const otp = String(body.otp ?? "").trim().replace(/\s+/g, "");

    const otpType =
      String(body.type ?? "LOGIN").trim().toUpperCase() === "REGISTRATION"
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

    const submittedOtpHash = hashOTP(otp);

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

    // Guard against double-submits / race conditions within 5 seconds of verification
    if (!otpRecord) {
      const recentVerified = await prisma.oTP.findFirst({
        where: {
          mobile: cleanMobile,
          verified: true,
          type: otpType,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (recentVerified) {
        const parsed = parseOtpCodeRecord(recentVerified.code);
        const matchesOtp = parsed.verifiedOtpHash
          ? parsed.verifiedOtpHash === submittedOtpHash
          : parsed.baseCode === submittedOtpHash;
        const verifiedWithinWindow =
          parsed.verifiedAtMs !== null &&
          Date.now() - parsed.verifiedAtMs >= 0 &&
          Date.now() - parsed.verifiedAtMs <= OTP_VERIFY_IDEMPOTENCY_MS;

        if (verifiedWithinWindow && matchesOtp) {
          return await completeOtpVerificationResponse({
            req,
            cleanMobile,
            otpType,
            recordLoginActivity: false,
          });
        }
      }

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

    // 1. Check SHA-256 hash FIRST for DLT OTPs (avoids erroneous Smart OTP /dev/otp/verify failures)
    const parsedPending = parseOtpCodeRecord(otpRecord.code);
    const isHashValid = parsedPending.baseCode === submittedOtpHash;
    let smartVerifyError: string | undefined;
    let isSmartOtpValid = false;

    if (!isHashValid && parsedPending.baseCode.startsWith("FAST2SMS_")) {
      const { verifyFast2SmsOTP } = await import("@/lib/sms/fast2sms");
      const verifyResult = await verifyFast2SmsOTP(cleanMobile, otp);
      isSmartOtpValid = verifyResult.success;
      smartVerifyError = verifyResult.error;
    }

    if (!isHashValid && !isSmartOtpValid) {
      // Re-check row in case a concurrent Smart OTP request just verified this exact record
      const recheckedRow = await prisma.oTP.findUnique({
        where: { id: otpRecord.id },
      });
      if (recheckedRow?.verified) {
        const recheckedParsed = parseOtpCodeRecord(recheckedRow.code);
        const matchesOtp = recheckedParsed.verifiedOtpHash
          ? recheckedParsed.verifiedOtpHash === submittedOtpHash
          : recheckedParsed.baseCode === submittedOtpHash;
        const withinWindow =
          recheckedParsed.verifiedAtMs !== null &&
          Date.now() - recheckedParsed.verifiedAtMs >= 0 &&
          Date.now() - recheckedParsed.verifiedAtMs <= OTP_VERIFY_IDEMPOTENCY_MS;

        if (withinWindow && matchesOtp) {
          return await completeOtpVerificationResponse({
            req,
            cleanMobile,
            otpType,
            recordLoginActivity: false,
          });
        }
      }

      return NextResponse.json(
        {
          success: false,
          message:
            smartVerifyError ||
            "Incorrect OTP. Please enter the valid code received on SMS.",
        },
        { status: 400 }
      );
    }

    // Atomically mark verified in DB with timestamp metadata for idempotency checks
    const claim = await prisma.oTP.updateMany({
      where: {
        id: otpRecord.id,
        verified: false,
      },
      data: {
        verified: true,
        code: markOtpCodeVerified(otpRecord.code, otp),
      },
    });

    if (claim.count === 0) {
      const concurrentRow = await prisma.oTP.findUnique({
        where: { id: otpRecord.id },
      });
      if (concurrentRow?.verified) {
        const concurrentParsed = parseOtpCodeRecord(concurrentRow.code);
        const matchesOtp = concurrentParsed.verifiedOtpHash
          ? concurrentParsed.verifiedOtpHash === submittedOtpHash
          : concurrentParsed.baseCode === submittedOtpHash;
        const withinWindow =
          concurrentParsed.verifiedAtMs !== null &&
          Date.now() - concurrentParsed.verifiedAtMs >= 0 &&
          Date.now() - concurrentParsed.verifiedAtMs <= OTP_VERIFY_IDEMPOTENCY_MS;

        if (withinWindow && matchesOtp) {
          return await completeOtpVerificationResponse({
            req,
            cleanMobile,
            otpType,
            recordLoginActivity: false,
          });
        }
      }

      return NextResponse.json(
        {
          success: false,
          message: "No pending OTP found. Please click Resend OTP.",
        },
        { status: 404 }
      );
    }

    return await completeOtpVerificationResponse({
      req,
      cleanMobile,
      otpType,
      recordLoginActivity: true,
    });
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