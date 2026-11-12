import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRequestSession } from "@/lib/jwt";
import { autoGenerateAndSaveBiodataPdf } from "@/lib/pdf/biodata-generator";
import { getActiveProfileId } from "@/lib/auth/active-profile";

export async function GET(req: NextRequest) {
  try {
    const { session: payload } = await verifyRequestSession(req);

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(req.url);
    const profileIdParam = searchParams.get("profileId");
    const activeProfileId = getActiveProfileId(req, payload.activeProfileId);
    const targetLookupId = profileIdParam || activeProfileId;

    const whereClause: any = targetLookupId
      ? {
          OR: [{ id: targetLookupId }, { profileId: targetLookupId }],
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

// Helpers for safe Prisma field casting & null handling
function safeStr(val: any): string | null | undefined {
  if (val === undefined) return undefined;
  if (val === null || String(val).trim() === "") return null;
  return String(val).trim();
}

function safeInt(val: any): number | null | undefined {
  if (val === undefined) return undefined;
  if (val === null || String(val).trim() === "") return null;
  const parsed = parseInt(String(val), 10);
  return isNaN(parsed) ? null : parsed;
}

function safeIntDefault(val: any, defaultVal: number): number {
  if (val === undefined || val === null || String(val).trim() === "") return defaultVal;
  const parsed = parseInt(String(val), 10);
  return isNaN(parsed) ? defaultVal : parsed;
}

function safeDate(val: any): Date | null | undefined {
  if (val === undefined) return undefined;
  if (val === null || String(val).trim() === "") return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export async function PUT(req: NextRequest) {
  try {
    const { session: payload } = await verifyRequestSession(req);

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
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

      // Biodata & Horoscope Fields
      birthPlace,
      birthTime,
      gotra,
      manglik,
      diet,
      about,
      notes,

      // Family Fields
      fatherName,
      fatherOccupation,
      motherName,
      motherOccupation,
      brothers,
      sisters,
      familyType,
      familyStatus,

      // Education Fields
      highestQualification,
      college,
      occupationField,

      // Occupation Fields
      profession,
      company,
      annualIncome,

      // Partner Preference Fields
      minAge,
      maxAge,
      minHeight,
      maxHeight,
      preferredReligion,
      preferredCaste,
      dietPreference,

      // Location / Address
      city,

      // Photos
      photos,
    } = body;

    // Enforce 1-3 mandatory photos on profile update
    let sanitizedPhotos: string[] | undefined = undefined;
    if (photos !== undefined) {
      if (!Array.isArray(photos)) {
        return NextResponse.json(
          {
            success: false,
            message: "Photos must be a valid array.",
          },
          { status: 400 }
        );
      }

      sanitizedPhotos = photos
        .filter((url): url is string => typeof url === "string" && url.trim().length > 0)
        .map((url) => url.trim());

      if (sanitizedPhotos.length < 1) {
        return NextResponse.json(
          {
            success: false,
            message: "At least 1 photo is mandatory to create/update profile",
          },
          { status: 400 }
        );
      }

      if (sanitizedPhotos.length > 3) {
        return NextResponse.json(
          {
            success: false,
            message: "Maximum 3 photos allowed",
          },
          { status: 400 }
        );
      }
    }

    // Find Target Profile
    const effectiveTargetId = targetProfileId || getActiveProfileId(req, payload.activeProfileId);

    const whereProfile: any = effectiveTargetId
      ? {
          OR: [{ id: effectiveTargetId }, { profileId: effectiveTargetId }],
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
    // Members CANNOT edit legal name or gender once submitted. Admin has full rights.
    const isMember = payload.role !== "ADMIN";

    let normalizedAdminGender: "MALE" | "FEMALE" | undefined = undefined;
    if (!isMember && gender !== undefined && String(gender).trim() !== "") {
      const upperGender = String(gender).trim().toUpperCase();
      if (upperGender !== "MALE" && upperGender !== "FEMALE") {
        return NextResponse.json(
          { success: false, message: "Invalid gender value." },
          { status: 400 }
        );
      }
      normalizedAdminGender = upperGender;
    }

    // Handle Gotra safely: Gotra is not an explicit column on Profile in Prisma,
    // so store it structured in notes to prevent Prisma schema mismatch errors.
    const shouldUpdateNotes =
      notes !== undefined || about !== undefined || gotra !== undefined;
    let finalNotes =
      notes !== undefined || about !== undefined
        ? (safeStr(notes !== undefined ? notes : about) ?? "")
        : (profile.notes ?? "");

    if (gotra !== undefined) {
      const cleanGotra = String(gotra || "").trim();
      if (cleanGotra) {
        if (/Gotra:\s*[^;\n]+/i.test(finalNotes)) {
          finalNotes = finalNotes.replace(/Gotra:\s*[^;\n]+/i, `Gotra: ${cleanGotra}`);
        } else {
          finalNotes = finalNotes ? `${finalNotes}\nGotra: ${cleanGotra}` : `Gotra: ${cleanGotra}`;
        }
      }
    }

    const txOps: any[] = [];

    // 1. Update User (Only Admin can modify legal full name and gender)
    if (!isMember && (fullName || normalizedAdminGender)) {
      txOps.push(
        prisma.user.update({
          where: { id: profile.userId },
          data: {
            ...(fullName && String(fullName).trim() ? { fullName: String(fullName).trim() } : {}),
            ...(normalizedAdminGender ? { gender: normalizedAdminGender } : {}),
          },
        })
      );
    }

    // 2. Update Profile
    const cleanAdminFullName = fullName ? String(fullName).trim() : "";
    const profileUpdateData: any = {
      ...(!isMember && cleanAdminFullName
        ? {
            firstName: cleanAdminFullName.split(" ")[0] || cleanAdminFullName,
            lastName: cleanAdminFullName.split(" ").slice(1).join(" ") || null,
          }
        : {}),
    };

    if (dateOfBirth !== undefined) {
      profileUpdateData.dateOfBirth = safeDate(dateOfBirth);
    }
    if (height !== undefined) {
      profileUpdateData.height = safeStr(height);
    }
    if (maritalStatus !== undefined) {
      profileUpdateData.maritalStatus = safeStr(maritalStatus);
    }
    if (religion !== undefined) {
      profileUpdateData.religion = safeStr(religion);
    }
    if (caste !== undefined) {
      profileUpdateData.caste = safeStr(caste);
    }
    if (motherTongue !== undefined) {
      profileUpdateData.motherTongue = safeStr(motherTongue);
    }
    if (birthPlace !== undefined || city !== undefined) {
      profileUpdateData.birthPlace = safeStr(birthPlace !== undefined ? birthPlace : city);
    }
    if (birthTime !== undefined) {
      profileUpdateData.birthTime = safeStr(birthTime);
    }
    if (manglik !== undefined) {
      profileUpdateData.manglik = safeStr(manglik);
    }
    if (diet !== undefined) {
      profileUpdateData.diet = safeStr(diet);
    }
    if (shouldUpdateNotes) {
      profileUpdateData.notes = finalNotes.trim() ? finalNotes : null;
    }

    if (Object.keys(profileUpdateData).length > 0) {
      txOps.push(
        prisma.profile.update({
          where: { id: profile.id },
          data: profileUpdateData,
        })
      );
    }

    // 3. Family
    const hasFamilyUpdates =
      fatherName !== undefined ||
      fatherOccupation !== undefined ||
      motherName !== undefined ||
      motherOccupation !== undefined ||
      brothers !== undefined ||
      sisters !== undefined ||
      familyType !== undefined ||
      familyStatus !== undefined;

    if (hasFamilyUpdates) {
      txOps.push(
        prisma.family.upsert({
          where: { profileId: profile.id },
          update: {
            ...(fatherName !== undefined ? { fatherName: safeStr(fatherName) } : {}),
            ...(fatherOccupation !== undefined ? { fatherOccupation: safeStr(fatherOccupation) } : {}),
            ...(motherName !== undefined ? { motherName: safeStr(motherName) } : {}),
            ...(motherOccupation !== undefined ? { motherOccupation: safeStr(motherOccupation) } : {}),
            ...(brothers !== undefined ? { brothers: safeIntDefault(brothers, 0) } : {}),
            ...(sisters !== undefined ? { sisters: safeIntDefault(sisters, 0) } : {}),
            ...(familyType !== undefined ? { familyType: safeStr(familyType) } : {}),
            ...(familyStatus !== undefined ? { familyStatus: safeStr(familyStatus) } : {}),
          },
          create: {
            profileId: profile.id,
            fatherName: safeStr(fatherName) ?? null,
            fatherOccupation: safeStr(fatherOccupation) ?? null,
            motherName: safeStr(motherName) ?? null,
            motherOccupation: safeStr(motherOccupation) ?? null,
            brothers: safeIntDefault(brothers, 0),
            sisters: safeIntDefault(sisters, 0),
            familyType: safeStr(familyType) ?? null,
            familyStatus: safeStr(familyStatus) ?? null,
          },
        })
      );
    }

    // 4. Education
    const hasEducationUpdates =
      highestQualification !== undefined ||
      college !== undefined ||
      occupationField !== undefined;

    if (hasEducationUpdates) {
      txOps.push(
        prisma.education.upsert({
          where: { profileId: profile.id },
          update: {
            ...(highestQualification !== undefined ? { highestQualification: safeStr(highestQualification) } : {}),
            ...(college !== undefined ? { college: safeStr(college) } : {}),
            ...(occupationField !== undefined ? { occupationField: safeStr(occupationField) } : {}),
          },
          create: {
            profileId: profile.id,
            highestQualification: safeStr(highestQualification) ?? null,
            college: safeStr(college) ?? null,
            occupationField: safeStr(occupationField) ?? null,
          },
        })
      );
    }

    // 5. Occupation
    const hasOccupationUpdates =
      profession !== undefined ||
      company !== undefined ||
      annualIncome !== undefined;

    if (hasOccupationUpdates) {
      txOps.push(
        prisma.occupation.upsert({
          where: { profileId: profile.id },
          update: {
            ...(profession !== undefined ? { profession: safeStr(profession) } : {}),
            ...(company !== undefined ? { company: safeStr(company) } : {}),
            ...(annualIncome !== undefined ? { annualIncome: safeStr(annualIncome) } : {}),
          },
          create: {
            profileId: profile.id,
            profession: safeStr(profession) ?? null,
            company: safeStr(company) ?? null,
            annualIncome: safeStr(annualIncome) ?? null,
          },
        })
      );
    }

    // 6. Partner Preference
    const hasPrefUpdates =
      minAge !== undefined ||
      maxAge !== undefined ||
      minHeight !== undefined ||
      maxHeight !== undefined ||
      preferredReligion !== undefined ||
      preferredCaste !== undefined ||
      dietPreference !== undefined;

    if (hasPrefUpdates) {
      txOps.push(
        prisma.partnerPreference.upsert({
          where: { profileId: profile.id },
          update: {
            ...(minAge !== undefined ? { minAge: safeInt(minAge) } : {}),
            ...(maxAge !== undefined ? { maxAge: safeInt(maxAge) } : {}),
            ...(minHeight !== undefined ? { minHeight: safeStr(minHeight) } : {}),
            ...(maxHeight !== undefined ? { maxHeight: safeStr(maxHeight) } : {}),
            ...(preferredReligion !== undefined ? { preferredReligion: safeStr(preferredReligion) } : {}),
            ...(preferredCaste !== undefined ? { preferredCaste: safeStr(preferredCaste) } : {}),
            ...(dietPreference !== undefined ? { dietPreference: safeStr(dietPreference) } : {}),
          },
          create: {
            profileId: profile.id,
            minAge: safeInt(minAge) ?? null,
            maxAge: safeInt(maxAge) ?? null,
            minHeight: safeStr(minHeight) ?? null,
            maxHeight: safeStr(maxHeight) ?? null,
            preferredReligion: safeStr(preferredReligion) ?? null,
            preferredCaste: safeStr(preferredCaste) ?? null,
            dietPreference: safeStr(dietPreference) ?? null,
          },
        })
      );
    }

    // 7. Profile Photos Update
    if (Array.isArray(sanitizedPhotos)) {
      txOps.push(
        prisma.profilePhoto.deleteMany({
          where: {
            profileId: profile.id,
          },
        })
      );

      if (sanitizedPhotos.length > 0) {
        txOps.push(
          prisma.profilePhoto.createMany({
            data: sanitizedPhotos.slice(0, 3).map((photoUrl: string, idx: number) => ({
              profileId: profile.id,
              imageUrl: photoUrl,
              isPrimary: idx === 0,
            })),
          })
        );
      }
    }

    if (txOps.length > 0) {
      await prisma.$transaction(txOps);
    }

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
  } catch (error) {
    console.error("PROFILE API PUT ERROR =>", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update profile. Please try again.",
      },
      { status: 500 }
    );
  }
}