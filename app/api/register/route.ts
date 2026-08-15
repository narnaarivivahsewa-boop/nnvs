import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

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

      photos = [],
    } = body;

    // ===========================
    // Check Existing Mobile
    // ===========================

    const existingMobile = await prisma.user.findUnique({
      where: {
        mobile,
      },
    });

    if (existingMobile) {
      return NextResponse.json(
        {
          success: false,
          message: "Mobile number already registered.",
        },
        {
          status: 400,
        }
      );
    }

    // ===========================
    // Check Existing Email
    // ===========================

    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (existingEmail) {
        return NextResponse.json(
          {
            success: false,
            message: "Email already registered.",
          },
          {
            status: 400,
          }
        );
      }
    }

    // ===========================
    // Hash Password
    // ===========================

    const hashedPassword = await bcrypt.hash(password, 10);

    // ===========================
    // Transaction
    // ===========================

    const result = await prisma.$transaction(async (tx) => {

      // -------------------------
      // User
      // -------------------------

      const user = await tx.user.create({
        data: {
          fullName,
          mobile,
          email,

          password: hashedPassword,

          gender:
            gender === "Male"
              ? "MALE"
              : "FEMALE",

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

          profileId: `NNVS${Date.now()}`,

          firstName: fullName,

          dateOfBirth: dateOfBirth
            ? new Date(dateOfBirth)
            : null,

          height:
  height && height !== ""
    ? String(height)
    : null,

          maritalStatus,
          religion,
          caste,
          motherTongue,

          paymentCompleted: false,

          isVisible: false,
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
    // Success Response
    // ===========================

    return NextResponse.json({
      success: true,
      message: "Registration Successful",
      userId: result.user.id,
      profileId: result.profile.profileId,
    });

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