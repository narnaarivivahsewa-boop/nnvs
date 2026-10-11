import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { autoGenerateAndSaveBiodataPdf } from "@/lib/pdf/biodata-generator";

export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { id } = await context.params;

    const profile = await prisma.profile.findFirst({
      where: {
        OR: [{ id }, { profileId: id }],
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            mobile: true,
            email: true,
            gender: true,
            status: true,
            mobileVerified: true,
            emailVerified: true,
            createdAt: true,
            payments: {
              where: { status: "SUCCESS" },
              orderBy: { createdAt: "desc" },
            },
          },
        },
        photos: {
          orderBy: {
            isPrimary: "desc",
          },
        },
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
  } catch (error: any) {
    console.error("ADMIN PROFILE DETAILS ERROR =>", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

// FULL CRUD: PUT (Update any profile or user field as Admin)
export async function PUT(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const body = await req.json();

    const profile = await prisma.profile.findFirst({
      where: {
        OR: [{ id }, { profileId: id }],
      },
      include: { user: true },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profile not found." },
        { status: 404 }
      );
    }

    const {
      fullName,
      gender,
      mobile,
      email,
      userStatus,

      firstName,
      lastName,
      dateOfBirth,
      height,
      maritalStatus,
      religion,
      caste,
      motherTongue,

      approvalStatus,
      isVisible,
      paymentCompleted,
      isPaymentExempted,
      paymentExemptionReason,
      oldNnvsId,
      legacyProfileId,

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

    await prisma.$transaction(async (tx) => {
      // 1. Update User Record
      const userUpdates: any = {};
      if (fullName !== undefined) userUpdates.fullName = fullName;
      if (gender !== undefined) userUpdates.gender = String(gender).toUpperCase();
      if (mobile !== undefined) userUpdates.mobile = mobile;
      if (email !== undefined) userUpdates.email = email;
      if (userStatus !== undefined) userUpdates.status = userStatus;

      if (Object.keys(userUpdates).length > 0) {
        await tx.user.update({
          where: { id: profile.userId },
          data: userUpdates,
        });
      }

      // 2. Update Profile Record
      const profileUpdates: any = {};
      if (firstName !== undefined) profileUpdates.firstName = firstName;
      else if (fullName !== undefined) profileUpdates.firstName = fullName.split(" ")[0] || fullName;

      if (lastName !== undefined) profileUpdates.lastName = lastName;
      else if (fullName !== undefined) profileUpdates.lastName = fullName.split(" ").slice(1).join(" ") || null;

      if (dateOfBirth !== undefined) profileUpdates.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
      if (height !== undefined) profileUpdates.height = height ? String(height) : null;
      if (maritalStatus !== undefined) profileUpdates.maritalStatus = maritalStatus;
      if (religion !== undefined) profileUpdates.religion = religion;
      if (caste !== undefined) profileUpdates.caste = caste;
      if (motherTongue !== undefined) profileUpdates.motherTongue = motherTongue;

      if (approvalStatus !== undefined) profileUpdates.approvalStatus = approvalStatus;
      if (isVisible !== undefined) profileUpdates.isVisible = Boolean(isVisible);
      if (paymentCompleted !== undefined) profileUpdates.paymentCompleted = Boolean(paymentCompleted);
      if (isPaymentExempted !== undefined) profileUpdates.isPaymentExempted = Boolean(isPaymentExempted);
      if (paymentExemptionReason !== undefined) profileUpdates.paymentExemptionReason = paymentExemptionReason;
      if (oldNnvsId !== undefined) profileUpdates.oldNnvsId = oldNnvsId;
      if (legacyProfileId !== undefined) profileUpdates.legacyProfileId = legacyProfileId;

      await tx.profile.update({
        where: { id: profile.id },
        data: profileUpdates,
      });

      // 3. Update Family Details
      if (fatherName !== undefined || motherName !== undefined || brothers !== undefined || sisters !== undefined) {
        await tx.family.upsert({
          where: { profileId: profile.id },
          update: {
            ...(fatherName !== undefined ? { fatherName } : {}),
            ...(motherName !== undefined ? { motherName } : {}),
            ...(brothers !== undefined ? { brothers: brothers ? parseInt(brothers) : 0 } : {}),
            ...(sisters !== undefined ? { sisters: sisters ? parseInt(sisters) : 0 } : {}),
            ...(familyType !== undefined ? { familyType } : {}),
            ...(familyStatus !== undefined ? { familyStatus } : {}),
          },
          create: {
            profileId: profile.id,
            fatherName: fatherName || null,
            motherName: motherName || null,
            brothers: brothers ? parseInt(brothers) : 0,
            sisters: sisters ? parseInt(sisters) : 0,
            familyType: familyType || null,
            familyStatus: familyStatus || null,
          },
        });
      }

      // 4. Update Education
      if (highestQualification !== undefined || college !== undefined || occupationField !== undefined) {
        await tx.education.upsert({
          where: { profileId: profile.id },
          update: {
            ...(highestQualification !== undefined ? { highestQualification } : {}),
            ...(college !== undefined ? { college } : {}),
            ...(occupationField !== undefined ? { occupationField } : {}),
          },
          create: {
            profileId: profile.id,
            highestQualification: highestQualification || null,
            college: college || null,
            occupationField: occupationField || null,
          },
        });
      }

      // 5. Update Occupation
      if (profession !== undefined || company !== undefined || annualIncome !== undefined) {
        await tx.occupation.upsert({
          where: { profileId: profile.id },
          update: {
            ...(profession !== undefined ? { profession } : {}),
            ...(company !== undefined ? { company } : {}),
            ...(annualIncome !== undefined ? { annualIncome: annualIncome ? String(annualIncome) : null } : {}),
          },
          create: {
            profileId: profile.id,
            profession: profession || null,
            company: company || null,
            annualIncome: annualIncome ? String(annualIncome) : null,
          },
        });
      }

      // 6. Update Partner Preference
      if (minAge !== undefined || maxAge !== undefined || preferredCaste !== undefined || preferredReligion !== undefined) {
        await tx.partnerPreference.upsert({
          where: { profileId: profile.id },
          update: {
            ...(minAge !== undefined ? { minAge: minAge ? parseInt(minAge) : null } : {}),
            ...(maxAge !== undefined ? { maxAge: maxAge ? parseInt(maxAge) : null } : {}),
            ...(minHeight !== undefined ? { minHeight: minHeight ? String(minHeight) : null } : {}),
            ...(maxHeight !== undefined ? { maxHeight: maxHeight ? String(maxHeight) : null } : {}),
            ...(preferredReligion !== undefined ? { preferredReligion } : {}),
            ...(preferredCaste !== undefined ? { preferredCaste } : {}),
          },
          create: {
            profileId: profile.id,
            minAge: minAge ? parseInt(minAge) : null,
            maxAge: maxAge ? parseInt(maxAge) : null,
            minHeight: minHeight ? String(minHeight) : null,
            maxHeight: maxHeight ? String(maxHeight) : null,
            preferredReligion: preferredReligion || null,
            preferredCaste: preferredCaste || null,
          },
        });
      }
    });

    // Auto-regenerate and replace the PDF upon admin edit
    autoGenerateAndSaveBiodataPdf(profile.id).catch((err) => {
      console.error("Auto PDF regeneration on admin update failed:", err);
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully by Admin.",
    });
  } catch (error: any) {
    console.error("ADMIN PROFILE PUT ERROR =>", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

// FULL CRUD: DELETE (Safely remove profile as Admin)
export async function DELETE(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { id } = await context.params;

    const profile = await prisma.profile.findFirst({
      where: {
        OR: [{ id }, { profileId: id }],
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profile not found." },
        { status: 404 }
      );
    }

    await prisma.profile.delete({
      where: { id: profile.id },
    });

    return NextResponse.json({
      success: true,
      message: `Profile ${profile.profileId} deleted successfully by Admin.`,
    });
  } catch (error: any) {
    console.error("ADMIN PROFILE DELETE ERROR =>", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to delete profile.",
      },
      { status: 500 }
    );
  }
}