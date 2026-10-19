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

      birthPlace,
      birthTime,
      gotra,
      manglik,
      diet,
      about,
      notes,

      fatherName,
      fatherOccupation,
      motherName,
      motherOccupation,
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
      dietPreference,
    } = body;

    const safeAdminStr = (val: any) => (val === undefined ? undefined : val === null || String(val).trim() === "" ? null : String(val).trim());
    const safeAdminInt = (val: any, defaultVal: number | null = null) => {
      if (val === undefined) return undefined;
      if (val === null || String(val).trim() === "") return defaultVal;
      const parsed = parseInt(String(val), 10);
      return isNaN(parsed) ? defaultVal : parsed;
    };
    const safeAdminDate = (val: any) => {
      if (val === undefined) return undefined;
      if (val === null || String(val).trim() === "") return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    let finalAdminNotes = safeAdminStr(notes || about) ?? profile.notes ?? "";
    if (gotra !== undefined) {
      const cleanGotra = String(gotra || "").trim();
      if (cleanGotra) {
        if (/Gotra:\s*[^;\n]+/i.test(finalAdminNotes)) {
          finalAdminNotes = finalAdminNotes.replace(/Gotra:\s*[^;\n]+/i, `Gotra: ${cleanGotra}`);
        } else {
          finalAdminNotes = finalAdminNotes ? `${finalAdminNotes}\nGotra: ${cleanGotra}` : `Gotra: ${cleanGotra}`;
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update User Record
      const userUpdates: any = {};
      if (fullName !== undefined) userUpdates.fullName = safeAdminStr(fullName);
      if (gender !== undefined) userUpdates.gender = String(gender).toUpperCase();
      if (mobile !== undefined) userUpdates.mobile = safeAdminStr(mobile);
      if (email !== undefined) userUpdates.email = safeAdminStr(email);
      if (userStatus !== undefined) userUpdates.status = userStatus;

      if (Object.keys(userUpdates).length > 0) {
        await tx.user.update({
          where: { id: profile.userId },
          data: userUpdates,
        });
      }

      // 2. Update Profile Record
      const profileUpdates: any = {};
      if (firstName !== undefined) profileUpdates.firstName = safeAdminStr(firstName);
      else if (fullName !== undefined) profileUpdates.firstName = String(fullName).trim().split(" ")[0] || String(fullName).trim();

      if (lastName !== undefined) profileUpdates.lastName = safeAdminStr(lastName);
      else if (fullName !== undefined) profileUpdates.lastName = String(fullName).trim().split(" ").slice(1).join(" ") || null;

      if (dateOfBirth !== undefined) profileUpdates.dateOfBirth = safeAdminDate(dateOfBirth);
      if (height !== undefined) profileUpdates.height = safeAdminStr(height);
      if (maritalStatus !== undefined) profileUpdates.maritalStatus = safeAdminStr(maritalStatus);
      if (religion !== undefined) profileUpdates.religion = safeAdminStr(religion);
      if (caste !== undefined) profileUpdates.caste = safeAdminStr(caste);
      if (motherTongue !== undefined) profileUpdates.motherTongue = safeAdminStr(motherTongue);

      if (birthPlace !== undefined) profileUpdates.birthPlace = safeAdminStr(birthPlace);
      if (birthTime !== undefined) profileUpdates.birthTime = safeAdminStr(birthTime);
      if (manglik !== undefined) profileUpdates.manglik = safeAdminStr(manglik);
      if (diet !== undefined) profileUpdates.diet = safeAdminStr(diet);
      if (notes !== undefined || about !== undefined || gotra !== undefined) profileUpdates.notes = finalAdminNotes || null;

      if (approvalStatus !== undefined) profileUpdates.approvalStatus = approvalStatus;
      if (isVisible !== undefined) profileUpdates.isVisible = Boolean(isVisible);
      if (paymentCompleted !== undefined) profileUpdates.paymentCompleted = Boolean(paymentCompleted);
      if (isPaymentExempted !== undefined) profileUpdates.isPaymentExempted = Boolean(isPaymentExempted);
      if (paymentExemptionReason !== undefined) profileUpdates.paymentExemptionReason = safeAdminStr(paymentExemptionReason);
      if (oldNnvsId !== undefined) profileUpdates.oldNnvsId = safeAdminStr(oldNnvsId);
      if (legacyProfileId !== undefined) profileUpdates.legacyProfileId = safeAdminStr(legacyProfileId);

      await tx.profile.update({
        where: { id: profile.id },
        data: profileUpdates,
      });

      // 3. Update Family Details
      if (fatherName !== undefined || motherName !== undefined || brothers !== undefined || sisters !== undefined || fatherOccupation !== undefined || motherOccupation !== undefined || familyType !== undefined || familyStatus !== undefined) {
        await tx.family.upsert({
          where: { profileId: profile.id },
          update: {
            ...(fatherName !== undefined ? { fatherName: safeAdminStr(fatherName) } : {}),
            ...(fatherOccupation !== undefined ? { fatherOccupation: safeAdminStr(fatherOccupation) } : {}),
            ...(motherName !== undefined ? { motherName: safeAdminStr(motherName) } : {}),
            ...(motherOccupation !== undefined ? { motherOccupation: safeAdminStr(motherOccupation) } : {}),
            ...(brothers !== undefined ? { brothers: safeAdminInt(brothers, 0) } : {}),
            ...(sisters !== undefined ? { sisters: safeAdminInt(sisters, 0) } : {}),
            ...(familyType !== undefined ? { familyType: safeAdminStr(familyType) } : {}),
            ...(familyStatus !== undefined ? { familyStatus: safeAdminStr(familyStatus) } : {}),
          },
          create: {
            profileId: profile.id,
            fatherName: safeAdminStr(fatherName) || null,
            fatherOccupation: safeAdminStr(fatherOccupation) || null,
            motherName: safeAdminStr(motherName) || null,
            motherOccupation: safeAdminStr(motherOccupation) || null,
            brothers: safeAdminInt(brothers, 0) ?? 0,
            sisters: safeAdminInt(sisters, 0) ?? 0,
            familyType: safeAdminStr(familyType) || null,
            familyStatus: safeAdminStr(familyStatus) || null,
          },
        });
      }

      // 4. Update Education
      if (highestQualification !== undefined || college !== undefined || occupationField !== undefined) {
        await tx.education.upsert({
          where: { profileId: profile.id },
          update: {
            ...(highestQualification !== undefined ? { highestQualification: safeAdminStr(highestQualification) } : {}),
            ...(college !== undefined ? { college: safeAdminStr(college) } : {}),
            ...(occupationField !== undefined ? { occupationField: safeAdminStr(occupationField) } : {}),
          },
          create: {
            profileId: profile.id,
            highestQualification: safeAdminStr(highestQualification) || null,
            college: safeAdminStr(college) || null,
            occupationField: safeAdminStr(occupationField) || null,
          },
        });
      }

      // 5. Update Occupation
      if (profession !== undefined || company !== undefined || annualIncome !== undefined) {
        await tx.occupation.upsert({
          where: { profileId: profile.id },
          update: {
            ...(profession !== undefined ? { profession: safeAdminStr(profession) } : {}),
            ...(company !== undefined ? { company: safeAdminStr(company) } : {}),
            ...(annualIncome !== undefined ? { annualIncome: safeAdminStr(annualIncome) } : {}),
          },
          create: {
            profileId: profile.id,
            profession: safeAdminStr(profession) || null,
            company: safeAdminStr(company) || null,
            annualIncome: safeAdminStr(annualIncome) || null,
          },
        });
      }

      // 6. Update Partner Preference
      if (minAge !== undefined || maxAge !== undefined || preferredCaste !== undefined || preferredReligion !== undefined || minHeight !== undefined || maxHeight !== undefined || dietPreference !== undefined) {
        await tx.partnerPreference.upsert({
          where: { profileId: profile.id },
          update: {
            ...(minAge !== undefined ? { minAge: safeAdminInt(minAge) } : {}),
            ...(maxAge !== undefined ? { maxAge: safeAdminInt(maxAge) } : {}),
            ...(minHeight !== undefined ? { minHeight: safeAdminStr(minHeight) } : {}),
            ...(maxHeight !== undefined ? { maxHeight: safeAdminStr(maxHeight) } : {}),
            ...(preferredReligion !== undefined ? { preferredReligion: safeAdminStr(preferredReligion) } : {}),
            ...(preferredCaste !== undefined ? { preferredCaste: safeAdminStr(preferredCaste) } : {}),
            ...(dietPreference !== undefined ? { dietPreference: safeAdminStr(dietPreference) } : {}),
          },
          create: {
            profileId: profile.id,
            minAge: safeAdminInt(minAge) || null,
            maxAge: safeAdminInt(maxAge) || null,
            minHeight: safeAdminStr(minHeight) || null,
            maxHeight: safeAdminStr(maxHeight) || null,
            preferredReligion: safeAdminStr(preferredReligion) || null,
            preferredCaste: safeAdminStr(preferredCaste) || null,
            dietPreference: safeAdminStr(dietPreference) || null,
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
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            mobile: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profile not found." },
        { status: 404 }
      );
    }

    const candidateName =
      `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
      profile.user?.fullName ||
      profile.profileId;

    await prisma.$transaction(async (tx) => {
      // 1. Clean up references where this profile is the shortlisted target
      await tx.shortlist.deleteMany({
        where: {
          OR: [
            { shortlistedProfileId: profile.id },
            { shortlistedProfileId: profile.profileId },
          ],
        },
      });

      // 2. Clean up blocks where this profile is the blocked target
      await tx.block.deleteMany({
        where: {
          OR: [
            { blockedProfileId: profile.id },
            { blockedProfileId: profile.profileId },
          ],
        },
      });

      // 3. Unlink any assigned promo codes so foreign keys don't block deletion
      await tx.promoCode.updateMany({
        where: { assignedProfileId: profile.id },
        data: { assignedProfileId: null },
      });

      // 4. Delete the profile (cascades to photos, family, education, occupation, partnerPreference, phoneNumbers, interests)
      await tx.profile.delete({
        where: { id: profile.id },
      });

      // 5. Write an Audit Log for tracking
      await tx.auditLog.create({
        data: {
          userId: auth.user?.userId || null,
          action: "DELETE_PROFILE",
          module: "PROFILES",
          details: `Admin deleted profile ${profile.profileId} (${candidateName}, Mobile: ${profile.user?.mobile || "N/A"})`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Profile ${profile.profileId} (${candidateName}) deleted successfully by Admin.`,
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