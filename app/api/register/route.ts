import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { checkDuplicateRegistration } from "@/lib/duplicate-detector";
import {
  verifyRegistrationToken,
  generateToken,
  isSecureCookieRequest,
  AUTH_COOKIE_MAX_AGE,
  REG_VERIFICATION_COOKIE_NAME,
  REG_VERIFICATION_MAX_AGE,
} from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      fullName,
      mobile,
      email,
      password,

      gender,
      dateOfBirth,
      height,
      maritalStatus,
      religion,
      caste,
      motherTongue,
      country,
      state,
      city,

      fatherName,
      motherName,
      brothers,
      sisters,
      familyType,
      familyStatus,

      highestQualification,
      college,
      occupationField,
      profession,
      company,
      annualIncome,

      minAge,
      maxAge,
      minHeight,
      maxHeight,
      preferredReligion,
      preferredCaste,

      about,
      photos = [],
    } = body;

    const cleanFullName = String(fullName ?? "").trim();
    const cleanMobile = String(mobile ?? "").replace(/\D/g, "").slice(-10);
    const cleanEmail = email ? String(email).trim().toLowerCase() : null;
    const rawGender = String(gender || body.profileType || "")
      .trim()
      .toUpperCase();
    const normalizedGender: "MALE" | "FEMALE" =
      rawGender === "FEMALE" || rawGender === "BRIDE" || rawGender === "GIRL"
        ? "FEMALE"
        : "MALE";

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid 10-digit Indian mobile number.",
        },
        { status: 400 }
      );
    }

    let parsedDateOfBirth: Date | null = null;
    if (dateOfBirth) {
      const candidateDob = new Date(dateOfBirth);
      if (isNaN(candidateDob.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message: "Please provide a valid Date of Birth.",
          },
          { status: 400 }
        );
      }
      parsedDateOfBirth = candidateDob;
    }

    const cleanLocation =
      [city, state]
        .map((part) => String(part ?? "").trim())
        .filter(Boolean)
        .join(", ") || (country ? String(country).trim() : null);

    // ===========================
    // Mandatory Photo Validation (Min 1, Max 3)
    // ===========================
    if (!Array.isArray(photos) || photos.length < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "At least 1 photo is mandatory to create/update profile",
        },
        { status: 400 }
      );
    }

    if (photos.length > 3) {
      return NextResponse.json(
        {
          success: false,
          message: "Maximum 3 photos allowed",
        },
        { status: 400 }
      );
    }

    // ===========================
    // Multi-Signal Duplicate Check
    // ===========================
    const duplicateCheck = await checkDuplicateRegistration({
      mobile: cleanMobile,
      email: cleanEmail,
      fullName: cleanFullName,
      gender: normalizedGender,
      dateOfBirth,
      fatherName,
      motherName,
    });

    if (duplicateCheck.isDuplicate) {
      return NextResponse.json(
        {
          success: false,
          isDuplicate: true,
          maskedMobile: duplicateCheck.matchedMobileMasked,
          matchedProfileId: duplicateCheck.matchedProfileId,
          message:
            duplicateCheck.message ||
            `You have already registered with RishteClub using mobile number ${duplicateCheck.matchedMobileMasked}. Please login using your existing registered mobile number.`,
        },
        {
          status: 409,
        }
      );
    }

    // ===========================
    // Verify Mobile OTP Verification Status
    // ===========================
    const twoHoursAgo = new Date(Date.now() - REG_VERIFICATION_MAX_AGE * 1000);

    let hasValidRegToken = false;
    const tokenCandidate =
      (typeof body.registrationToken === "string" && body.registrationToken.trim()) ||
      req.cookies.get(REG_VERIFICATION_COOKIE_NAME)?.value ||
      "";

    if (tokenCandidate) {
      try {
        const decoded = await verifyRegistrationToken(tokenCandidate);
        if (decoded.mobile === cleanMobile) {
          hasValidRegToken = true;
        }
      } catch {
        // Invalid/expired registration token — fall through to DB check
      }
    }

    const [verifiedOtp, verifiedKundliLead] = hasValidRegToken
      ? [null, null]
      : await Promise.all([
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

    if (!hasValidRegToken && !verifiedOtp && !verifiedKundliLead) {
      return NextResponse.json(
        {
          success: false,
          message: "Please verify your mobile number with SMS OTP before submitting registration.",
        },
        {
          status: 400,
        }
      );
    }

    // ===========================
    // Hash Password
    // ===========================

    const hashedPassword = await bcrypt.hash(password, 10);

    // ===========================
    // Transaction
    // ===========================

    const result = await prisma.$transaction(async (tx) => {
      // Clear verified OTP after registration
      await tx.oTP.deleteMany({
        where: {
          mobile: cleanMobile,
        },
      });

      // -------------------------
      // User
      // -------------------------

      const user = await tx.user.create({
        data: {
          fullName: cleanFullName,
          mobile: cleanMobile,
          email: cleanEmail,

          password: hashedPassword,

          gender: normalizedGender,

          role: "MEMBER",

          status: "ACTIVE",

          mobileVerified: true,
        },
      });

      // -------------------------
      // Profile
      // -------------------------

      const profile = await tx.profile.create({
        data: {
          userId: user.id,

          profileId: `DRAFT-${Date.now()}`,

          firstName: cleanFullName,

          dateOfBirth: parsedDateOfBirth,

          birthPlace: cleanLocation || null,

          height:
            height && height !== ""
              ? String(height)
              : null,

          maritalStatus,
          religion,
          caste,
          motherTongue,
          notes: about ? String(about).trim() : null,

          paymentCompleted: false,
          approvalStatus: "DRAFT",

          isVisible: false,

          isDuplicateFlagged: duplicateCheck.flagForAdminReview || false,
          duplicateMatchedProfileId: duplicateCheck.matchedProfileId || null,
          duplicateNotes: duplicateCheck.flagForAdminReview
            ? `Potential duplicate name match with profile ID: ${duplicateCheck.matchedProfileId}`
            : null,
        },
      });
            // -------------------------
      // Family
      // -------------------------

      await tx.family.create({
        data: {
          profileId: profile.id,

          fatherName,
          motherName,

          brothers:
            brothers && brothers !== ""
              ? parseInt(brothers)
              : 0,

          sisters:
            sisters && sisters !== ""
              ? parseInt(sisters)
              : 0,

          familyType,
          familyStatus,
        },
      });

      // -------------------------
      // Education
      // -------------------------

      await tx.education.create({
        data: {
          profileId: profile.id,

          highestQualification,
          college,
          occupationField,
        },
      });

      // -------------------------
      // Occupation
      // -------------------------

      await tx.occupation.create({
        data: {
          profileId: profile.id,

          profession,
          company,
          annualIncome,
        },
      });

      // -------------------------
      // Partner Preference
      // -------------------------

      await tx.partnerPreference.create({
        data: {
          profileId: profile.id,

          minAge:
            minAge && minAge !== ""
              ? parseInt(minAge)
              : null,

          maxAge:
            maxAge && maxAge !== ""
              ? parseInt(maxAge)
              : null,

          minHeight:
  minHeight && minHeight !== ""
    ? String(minHeight)
    : null,

          maxHeight:
  maxHeight && maxHeight !== ""
    ? String(maxHeight)
    : null,

          preferredReligion,
          preferredCaste,
        },
      });

      // -------------------------
      // Profile Photos
      // -------------------------

      if (photos.length > 0) {
        await tx.profilePhoto.createMany({
          data: photos.map(
            (
              imageUrl: string,
              index: number
            ) => ({
              profileId: profile.id,
              imageUrl,
              isPrimary: index === 0,
            })
          ),
        });
      }

      return {
        user,
        profile,
      };
    });
        // ===========================
    // Success Response + Auto Sign-In Session
    // ===========================
    const sessionToken = await generateToken(
      result.user.id,
      result.user.mobile,
      result.user.role,
      result.profile.id
    );

    const successResponse = NextResponse.json({
      success: true,
      message: "Registration Successful",
      userId: result.user.id,
      profileId: result.profile.profileId,
      activeProfileId: result.profile.id,
      token: sessionToken,
    });

    const secureCookie = isSecureCookieRequest(req);

    successResponse.cookies.set(REG_VERIFICATION_COOKIE_NAME, "", {
      path: "/",
      maxAge: 0,
    });

    successResponse.cookies.set("nnvs_token", sessionToken, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE,
    });

    successResponse.cookies.set("activeProfileId", result.profile.id, {
      httpOnly: false,
      secure: secureCookie,
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE,
    });

    return successResponse;

  } catch (error: any) {
    console.error("REGISTER ERROR =>", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Internal Server Error",

        error:
          process.env.NODE_ENV === "development"
            ? String(error)
            : undefined,

        stack:
          process.env.NODE_ENV === "development"
            ? error?.stack
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}