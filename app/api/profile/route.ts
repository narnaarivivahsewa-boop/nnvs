import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { autoGenerateAndSaveBiodataPdf } from "@/lib/pdf/biodata-generator";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("nnvs_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    const { searchParams } = new URL(req.url);
    const profileIdParam = searchParams.get("profileId");

    const whereClause: any = profileIdParam
      ? {
          OR: [{ id: profileIdParam }, { profileId: profileIdParam }],
          ...(payload.role === "ADMIN" ? {} : { userId: payload.userId }),
        }
      : { userId: payload.userId };

    const profile = await prisma.profile.findFirst({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            mobile: true,
            email: true,
            gender: true,
            role: true,
            status: true,
          },
        },
        photos: true,
        family: true,
        education: true,
        occupation: true,
        partnerPreference: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message: "Profile not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("PROFILE API GET ERROR =>", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get("nnvs_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    const body = await req.json();

    const {
      profileId: targetProfileId,
      fullName,
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
    } = body;

    // Find Target Profile
    const whereProfile: any = targetProfileId
      ? {
          OR: [{ id: targetProfileId }, { profileId: targetProfileId }],
          ...(payload.role === "ADMIN" ? {} : { userId: payload.userId }),
        }
      : { userId: payload.userId };

    const profile = await prisma.profile.findFirst({
      where: whereProfile,
    });

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message: "Profile not found.",
        },
        { status: 404 }
      );
    }

    // Role-based Restrictions:
    // Members CANNOT edit name or gender once submitted. Admin has full rights.
    const isMember = payload.role !== "ADMIN";

    await prisma.$transaction(async (tx) => {
      // 1. Update User (Only Admin can modify legal full name and gender)
      if (!isMember && (fullName || gender)) {
        await tx.user.update({
          where: { id: profile.userId },
          data: {
            ...(fullName ? { fullName } : {}),
            ...(gender ? { gender: gender.toUpperCase() } : {}),
          },
        });
      }

      // 2. Update Profile
      await tx.profile.update({
        where: { id: profile.id },
        data: {
          // If not member, allow updating firstName/lastName
          ...(!isMember && fullName
            ? {
                firstName: fullName.split(" ")[0] || fullName,
                lastName: fullName.split(" ").slice(1).join(" ") || null,
              }
            : {}),

          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          height: height && height !== "" ? String(height) : null,
          maritalStatus,
          religion,
          caste,
          motherTongue,
        },
      });

      // 3. Family
      await tx.family.upsert({
        where: { profileId: profile.id },
        update: {
          fatherName,
          motherName,
          brothers: brothers && brothers !== "" ? parseInt(brothers) : 0,
          sisters: sisters && sisters !== "" ? parseInt(sisters) : 0,
          familyType,
          familyStatus,
        },
        create: {
          profileId: profile.id,
          fatherName,
          motherName,
          brothers: brothers && brothers !== "" ? parseInt(brothers) : 0,
          sisters: sisters && sisters !== "" ? parseInt(sisters) : 0,
          familyType,
          familyStatus,
        },
      });

      // 4. Education
      await tx.education.upsert({
        where: { profileId: profile.id },
        update: {
          highestQualification,
          college,
          occupationField,
        },
        create: {
          profileId: profile.id,
          highestQualification,
          college,
          occupationField,
        },
      });

      // 5. Occupation
      await tx.occupation.upsert({
        where: { profileId: profile.id },
        update: {
          profession,
          company,
          annualIncome: annualIncome && annualIncome !== "" ? String(annualIncome) : null,
        },
        create: {
          profileId: profile.id,
          profession,
          company,
          annualIncome: annualIncome && annualIncome !== "" ? String(annualIncome) : null,
        },
      });

      // 6. Partner Preference
      await tx.partnerPreference.upsert({
        where: { profileId: profile.id },
        update: {
          minAge: minAge && minAge !== "" ? parseInt(minAge) : null,
          maxAge: maxAge && maxAge !== "" ? parseInt(maxAge) : null,
          minHeight: minHeight && minHeight !== "" ? String(minHeight) : null,
          maxHeight: maxHeight && maxHeight !== "" ? String(maxHeight) : null,
          preferredReligion,
          preferredCaste,
        },
        create: {
          profileId: profile.id,
          minAge: minAge && minAge !== "" ? parseInt(minAge) : null,
          maxAge: maxAge && maxAge !== "" ? parseInt(maxAge) : null,
          minHeight: minHeight && minHeight !== "" ? String(minHeight) : null,
          maxHeight: maxHeight && maxHeight !== "" ? String(maxHeight) : null,
          preferredReligion,
          preferredCaste,
        },
      });
    });

    // Event Hook 2: Auto-regenerate and replace the PDF upon profile update
    autoGenerateAndSaveBiodataPdf(profile.id).catch((err) => {
      console.error("Auto PDF regeneration on profile update failed:", err);
    });

    return NextResponse.json({
      success: true,
      message: isMember
        ? "Profile updated successfully! Note: Name and Gender cannot be changed by members."
        : "Profile updated successfully with admin authorization.",
    });
  } catch (error: any) {
    console.error("PROFILE API PUT ERROR =>", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}