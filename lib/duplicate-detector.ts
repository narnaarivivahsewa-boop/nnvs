import { prisma } from "@/lib/prisma";

export interface DuplicateCheckInput {
  mobile: string;
  email?: string | null;
  fullName: string;
  gender?: string | null;
  dateOfBirth?: string | Date | null;
  fatherName?: string | null;
  motherName?: string | null;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  confidence: "EXACT_MOBILE" | "EXACT_EMAIL" | "HIGH_IDENTITY_MATCH" | "SUSPICIOUS_LOW" | "NONE";
  matchedProfileId?: string;
  matchedMobileMasked?: string;
  message?: string;
  flagForAdminReview?: boolean;
}

export function maskMobileNumber(mobile: string): string {
  if (!mobile) return "XXXXXX";
  const cleaned = mobile.replace(/\D/g, "");
  if (cleaned.length <= 4) return `XXXXXX${cleaned}`;
  const lastFour = cleaned.slice(-4);
  return `XXXXXX${lastFour}`;
}

export function normalizeText(str?: string | null): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/^(mr\.|mrs\.|ms\.|shri|smt\.|dr\.)\s+/i, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Checks if registration data matches an existing profile or user across both
 * direct website registrations and Google Form imported profiles.
 */
export async function checkDuplicateRegistration(
  input: DuplicateCheckInput
): Promise<DuplicateCheckResult> {
  const { mobile, email, fullName, gender, dateOfBirth, fatherName, motherName } = input;

  const normalizedInputName = normalizeText(fullName);
  const normalizedFatherName = normalizeText(fatherName);
  const normalizedMotherName = normalizeText(motherName);

  // 1. Check Exact Registered Mobile
  const existingByMobile = await prisma.user.findUnique({
    where: { mobile },
    include: { profile: true },
  });

  if (existingByMobile) {
    return {
      isDuplicate: true,
      confidence: "EXACT_MOBILE",
      matchedProfileId: existingByMobile.profile?.profileId,
      matchedMobileMasked: maskMobileNumber(mobile),
      message: `You have already registered with RishteClub using mobile number ${maskMobileNumber(
        mobile
      )}. Please login using your existing registered mobile number.`,
    };
  }

  // 2. Check Exact Email
  if (email && email.trim() !== "") {
    const existingByEmail = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { profile: true },
    });

    if (existingByEmail) {
      return {
        isDuplicate: true,
        confidence: "EXACT_EMAIL",
        matchedProfileId: existingByEmail.profile?.profileId,
        matchedMobileMasked: maskMobileNumber(existingByEmail.mobile),
        message: `An account with this email already exists under registered mobile ${maskMobileNumber(
          existingByEmail.mobile
        )}. Please login using your registered mobile number.`,
      };
    }
  }

  // 3. Multi-Signal Identity Matching against existing Profiles & Families
  const targetDob = dateOfBirth ? new Date(dateOfBirth) : null;
  const isTargetDobValid = targetDob && !isNaN(targetDob.getTime());

  // Search candidate profiles with matching first name or last name and gender if provided
  const candidateProfiles = await prisma.profile.findMany({
    where: {
      ...(gender
        ? {
            user: {
              gender: gender.toUpperCase() === "FEMALE" ? "FEMALE" : "MALE",
            },
          }
        : {}),
      OR: [
        { firstName: { contains: fullName.split(" ")[0], mode: "insensitive" } },
        { user: { fullName: { contains: fullName.split(" ")[0], mode: "insensitive" } } },
      ],
    },
    include: {
      user: true,
      family: true,
    },
    take: 20,
  });

  for (const cand of candidateProfiles) {
    const candName = normalizeText(cand.user?.fullName || cand.firstName);
    const candFather = normalizeText(cand.family?.fatherName);
    const candMother = normalizeText(cand.family?.motherName);

    const nameMatches = candName.length >= 3 && candName === normalizedInputName;
    const fatherMatches = candFather.length >= 3 && candFather === normalizedFatherName;
    const motherMatches = candMother.length >= 3 && candMother === normalizedMotherName;

    let dobMatches = false;
    if (isTargetDobValid && cand.dateOfBirth) {
      const candDob = new Date(cand.dateOfBirth);
      dobMatches =
        candDob.getFullYear() === targetDob.getFullYear() &&
        candDob.getMonth() === targetDob.getMonth() &&
        candDob.getDate() === targetDob.getDate();
    }

    // High Confidence Multi-signal rule:
    // (a) Exact Full Name + DOB
    // (b) Exact Full Name + Father's Name
    // (c) Exact Full Name + Mother's Name
    if (nameMatches && (dobMatches || fatherMatches || motherMatches)) {
      const maskedMobile = maskMobileNumber(cand.user.mobile);
      return {
        isDuplicate: true,
        confidence: "HIGH_IDENTITY_MATCH",
        matchedProfileId: cand.profileId,
        matchedMobileMasked: maskedMobile,
        message: `You have already registered with RishteClub using mobile number ${maskedMobile}. Please login using your existing registered mobile number.`,
      };
    }

    // Low confidence signal: flag for admin review without blocking
    if (nameMatches && !dobMatches && !fatherMatches) {
      return {
        isDuplicate: false,
        confidence: "SUSPICIOUS_LOW",
        matchedProfileId: cand.profileId,
        flagForAdminReview: true,
      };
    }
  }

  return {
    isDuplicate: false,
    confidence: "NONE",
  };
}
