import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { autoGenerateAndSaveBiodataPdf } from "@/lib/pdf/biodata-generator";
import { getActiveProfileId } from "@/lib/auth/active-profile";

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

    // Handle Gotra safely: Gotra is not an explicit column on Profile in Prisma,
    // so store it structured in notes to prevent Prisma schema mismatch errors.
    let finalNotes = safeStr(notes || about) ?? profile.notes ?? "";
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

    await prisma.$transaction(async (tx) => {
      // 1. Update User (Only Admin can modify legal full name and gender)
      if (!isMember && (fullName || gender)) {
        await tx.user.update({
          where: { id: profile.userId },
          data: {
            ...(fullName ? { fullName: String(fullName).trim() } : {}),
            ...(gender ? { gender: String(gender).toUpperCase() as any } : {}),
          },
        });
      }

      // 2. Update Profile
      const profileUpdateData: any = {
        ...(!isMember && fullName
          ? {
              firstName: String(fullName).trim().split(" ")[0] || String(fullName).trim(),
              lastName: String(fullName).trim().split(" ").slice(1).join(" ") || null,
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
        profileUpdateData.birthPlace = safeStr(birthPlace || city);
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
      if (finalNotes !== undefined) {
        profileUpdateData.notes = finalNotes || null;
      }

      await tx.profile.update({
        where: { id: profile.id },
        data: profileUpdateData,
      });

      // 3. Family
      await tx.family.upsert({
        where: { profileId: profile.id },
        update: {
          fatherName: safeStr(fatherName),
          fatherOccupation: safeStr(fatherOccupation),
          motherName: safeStr(motherName),
          motherOccupation: safeStr(motherOccupation),
          brothers: safeIntDefault(brothers, 0),
          sisters: safeIntDefault(sisters, 0),
          familyType: safeStr(familyType),
          familyStatus: safeStr(familyStatus),
        },
        create: {
          profileId: profile.id,
          fatherName: safeStr(fatherName),
          fatherOccupation: safeStr(fatherOccupation),
          motherName: safeStr(motherName),
          motherOccupation: safeStr(motherOccupation),
          brothers: safeIntDefault(brothers, 0),
          sisters: safeIntDefault(sisters, 0),
          familyType: safeStr(familyType),
          familyStatus: safeStr(familyStatus),
        },
      });

      // 4. Education
      await tx.education.upsert({
        where: { profileId: profile.id },
        update: {
          highestQualification: safeStr(highestQualification),
          college: safeStr(college),
          occupationField: safeStr(occupationField),
        },
        create: {
          profileId: profile.id,
          highestQualification: safeStr(highestQualification),
          college: safeStr(college),
          occupationField: safeStr(occupationField),
        },
      });

      // 5. Occupation
      await tx.occupation.upsert({
        where: { profileId: profile.id },
        update: {
          profession: safeStr(profession),
          company: safeStr(company),
          annualIncome: safeStr(annualIncome),
        },
        create: {
          profileId: profile.id,
          profession: safeStr(profession),
          company: safeStr(company),
          annualIncome: safeStr(annualIncome),
        },
      });

      // 6. Partner Preference
      await tx.partnerPreference.upsert({
        where: { profileId: profile.id },
        update: {
          minAge: safeInt(minAge),
          maxAge: safeInt(maxAge),
          minHeight: safeStr(minHeight),
          maxHeight: safeStr(maxHeight),
          preferredReligion: safeStr(preferredReligion),
          preferredCaste: safeStr(preferredCaste),
          dietPreference: safeStr(dietPreference),
        },
        create: {
          profileId: profile.id,
          minAge: safeInt(minAge),
          maxAge: safeInt(maxAge),
          minHeight: safeStr(minHeight),
          maxHeight: safeStr(maxHeight),
          preferredReligion: safeStr(preferredReligion),
          preferredCaste: safeStr(preferredCaste),
          dietPreference: safeStr(dietPreference),
        },
      });

      // 7. Profile Photos Update
      if (Array.isArray(photos)) {
        await tx.profilePhoto.deleteMany({
          where: {
            profileId: profile.id,
          },
        });

        if (photos.length > 0) {
          await tx.profilePhoto.createMany({
            data: photos.slice(0, 3).map((photoUrl: string, idx: number) => ({
              profileId: profile.id,
              imageUrl: photoUrl,
              isPrimary: idx === 0,
            })),
          });
        }
      }
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