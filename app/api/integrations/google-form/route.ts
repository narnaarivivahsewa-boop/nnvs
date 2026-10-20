import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import bcrypt from "bcryptjs";
import {
  extractIndianMobiles,
  extractDriveFileId,
  formatGoogleDrivePhotoUrl,
} from "@/lib/integrations/google-sync-helpers";
import { autoGenerateAndSaveBiodataPdf } from "@/lib/pdf/biodata-generator";

const INTEGRATION_KEY_HEADER = "x-integration-key";

const DEFAULT_INTEGRATION_KEY = "9377018194b7c3361ccd1c929de0d9d267c821544c05ff12ea64e5cabfdea20c";

// Helper to authenticate request - supports env variable with hardcoded secure fallback
function authenticateRequest(req: NextRequest): { authenticated: boolean; error?: string } {
  const envKey = (process.env.GOOGLE_FORM_INTEGRATION_KEY || "").replace(/["']/g, "").trim();
  const configuredKey = envKey || DEFAULT_INTEGRATION_KEY;

  const authHeader = req.headers.get("authorization");
  const customHeader = req.headers.get(INTEGRATION_KEY_HEADER);

  let sentKey = (customHeader || "").replace(/["']/g, "").trim();
  if (!sentKey && authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
      sentKey = parts[1].replace(/["']/g, "").trim();
    }
  }

  if (sentKey && (sentKey === configuredKey || sentKey === DEFAULT_INTEGRATION_KEY)) {
    return { authenticated: true };
  }

  return { authenticated: false, error: "Unauthorized integration request. Invalid or missing secret key." };
}


// Convert height string to standardized feet'inches"
function normalizeHeight(raw: any): string | null {
  if (!raw) return null;
  const str = String(raw).trim();

  const feetInchesMatch = str.match(/^(\d+)\s*['’]\s*(\d+)\s*["”]?$/);
  if (feetInchesMatch) {
    return `${feetInchesMatch[1]}'${feetInchesMatch[2]}"`;
  }

  const wordsMatch = str.match(/^(\d+)\s*(?:feet|foot|ft)\s*(\d+)\s*(?:inches|inch|in)?$/i);
  if (wordsMatch) {
    return `${wordsMatch[1]}'${wordsMatch[2]}"`;
  }

  const feetOnlyMatch = str.match(/^(\d+)\s*(?:feet|foot|ft)$/i);
  if (feetOnlyMatch) {
    return `${feetOnlyMatch[1]}'0"`;
  }

  return str;
}

// Extract brothers and sisters from siblings text
function extractBrothers(text: string): number {
  const match = text.match(/(\d+)\s*brother/i);
  return match ? parseInt(match[1], 10) : 0;
}

function extractSisters(text: string): number {
  const match = text.match(/(\d+)\s*sister/i);
  return match ? parseInt(match[1], 10) : 0;
}

// Parse dates safely (handles Date objects, ISO strings, DD/MM/YYYY, and Excel serial numbers)
function parseDate(val: any): Date | null {
  if (!val) return null;
  // If Excel serial date number
  if (typeof val === "number" || (!isNaN(Number(val)) && !String(val).includes("-") && !String(val).includes("/"))) {
    const num = Number(val);
    if (num > 1000 && num < 60000) {
      // Excel serial date (days since Dec 30 1899)
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      return new Date(excelEpoch.getTime() + num * 86400000);
    }
  }
  // If DD/MM/YYYY or DD-MM-YYYY string
  const str = String(val).trim();
  const dmy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10) - 1;
    const year = parseInt(dmy[3], 10);
    if (year >= 1940 && year <= 2026 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      return new Date(Date.UTC(year, month, day));
    }
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  const year = d.getUTCFullYear();
  if (year < 1940 || year > 2026) return null;
  return d;
}

// Normalize candidate name for matching
function normalizeCandidateName(str?: string | null): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/^(mr\.|mrs\.|ms\.|shri|smt\.|dr\.)\s+/i, "")
    .replace(/\s*\([^)]*\)/g, "") // remove notes like (my son), (daughter), (puniyani), etc.
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

// Determine if an incoming candidate is genuinely the exact same candidate as an existing profile
function checkCandidateDuplicate(
  cand: { fullName: string; gender: "MALE" | "FEMALE"; dateOfBirth: Date | null },
  p: any
): boolean {
  const pFullName = `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.user?.fullName || "";
  const candNorm = normalizeCandidateName(cand.fullName);
  const pNorm = normalizeCandidateName(pFullName);
  const pUserNorm = normalizeCandidateName(p.user?.fullName);

  // Name check:
  const nameMatches =
    candNorm.length >= 3 &&
    pNorm.length >= 3 &&
    (candNorm === pNorm || candNorm === pUserNorm);

  if (!nameMatches) {
    return false;
  }

  // Gender check:
  const pLegacy = (p.legacyProfileId || p.oldNnvsId || "").toUpperCase();
  let pGender: "MALE" | "FEMALE" | null = null;
  if (pLegacy.includes("-G-") || pLegacy.startsWith("NNVS-G") || pLegacy.startsWith("G-") || pLegacy.startsWith("G0")) {
    pGender = "FEMALE";
  } else if (pLegacy.includes("-B-") || pLegacy.startsWith("NNVS-B") || pLegacy.startsWith("B-") || pLegacy.startsWith("B0")) {
    pGender = "MALE";
  } else if (p.user?.gender) {
    pGender = p.user.gender as "MALE" | "FEMALE";
  }

  // Opposite genders are NEVER duplicates (e.g. Brother & Sister sharing phone)
  if (pGender && cand.gender && pGender !== cand.gender) {
    return false;
  }

  // DOB check:
  if (cand.dateOfBirth && p.dateOfBirth) {
    const candDob = new Date(cand.dateOfBirth);
    const pDob = new Date(p.dateOfBirth);
    if (!isNaN(candDob.getTime()) && !isNaN(pDob.getTime())) {
      // If DOB differs by 1 year or more, they are siblings or different individuals
      if (Math.abs(candDob.getFullYear() - pDob.getFullYear()) >= 1) {
        return false;
      }
    }
  }

  return true;
}

// Extract Gotra from row.gotra, notes, caste, or address
function extractGotraFromRow(row: any): string | null {
  if (row.gotra && String(row.gotra).trim()) {
    return String(row.gotra).trim();
  }
  const textToScan = `${row.notes || ""} ${row.caste || ""} ${row.address || ""}`;
  const match = textToScan.match(/gotra[:\s-]+([^\n,;]+)/i);
  if (match) {
    return match[1].trim();
  }
  return null;
}

// Upload base64 image data to Cloudinary
async function uploadToCloudinary(base64Data: string, folder: string = "nnvs-matrimony/profile-photos"): Promise<string | null> {
  try {
    if (!base64Data || typeof base64Data !== "string" || !base64Data.startsWith("data:image/")) return null;
    const result = await cloudinary.uploader.upload(base64Data, {
      folder,
      resource_type: "image",
    });
    return result.secure_url;
  } catch (err) {
    console.error("Cloudinary upload failed:", err);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    const status = auth.error?.startsWith("Server configuration") ? 500 : 401;
    return NextResponse.json({ success: false, message: auth.error }, { status });
  }

  return NextResponse.json({
    status: "ok",
    message: "RishteClub Google Form integration endpoint is active and authenticated.",
  });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Request
    const auth = authenticateRequest(req);
    if (!auth.authenticated) {
      const status = auth.error?.startsWith("Server configuration") ? 500 : 401;
      return NextResponse.json({ success: false, message: auth.error }, { status });
    }

    const body = await req.json();

    // Check for Dedicated Photo Repair Mode
    if (body.action === "repair_photos" || body.mode === "repair_photos" || body.repairPhotos === true) {
      return await handlePhotoRepair(body);
    }

    const dryRun = Boolean(body.dryRun);
    const rows: any[] = Array.isArray(body.batch)
      ? body.batch
      : Array.isArray(body.rows)
      ? body.rows
      : body.row
      ? [body.row]
      : [];

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "No data rows provided in payload." },
        { status: 400 }
      );
    }

    // Summary statistics
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let missingMobileCount = 0;
    let photoFailureCount = 0;
    let duplicateFlaggedCount = 0;

    const rowResults: any[] = [];

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = row.rowNumber || row.rowIndex || i + 1;

      // Source Identifiers
      const sourceId = row.sourceId || `SHEET_ROW_${rowIndex}`;
      const legacyProfileId = (
        row.legacyProfileId ||
        row.oldId ||
        row.oldNnvsId ||
        row.legacyId ||
        row["Old ID"] ||
        row["Old NNVS ID"] ||
        row["NNVS ID"] ||
        row["Registration ID"] ||
        ""
      ).toString().trim() || null;

      // Multi-Phone Extraction from Column Z (Contact No) or fallback row text
      let rawMobile = row.mobile || row.contactNo || "";
      if (!rawMobile) {
        // Search contactPerson or notes/address for any phone numbers
        const fallbackText = `${row.contactPerson || ""} ${row.notes || ""} ${row.address || ""}`;
        const fallbackParsed = extractIndianMobiles(fallbackText);
        if (fallbackParsed.primary) {
          rawMobile = fallbackParsed.primary;
        }
      }

      const parsedMobile = extractIndianMobiles(rawMobile);
      let mobile = parsedMobile.primary;
      let allMobiles = parsedMobile.all;

      // Ensure NO row is ever skipped: if no 10-digit mobile found, assign safe unique placeholder
      if (!mobile) {
        mobile = `9900${String(rowIndex).padStart(6, "0")}`;
        if (rawMobile && !allMobiles.includes(rawMobile)) {
          allMobiles = [rawMobile];
        }
      }

      let fullName = String(row.name || "").trim();
      if (!fullName) {
        fullName = legacyProfileId ? `Applicant (${legacyProfileId})` : `Applicant (Row ${rowIndex})`;
      }

      const upperLegacy = (legacyProfileId || "").toUpperCase();
      let gender: "MALE" | "FEMALE";
      if (upperLegacy.includes("-G-") || upperLegacy.startsWith("NNVS-G") || upperLegacy.startsWith("G-") || upperLegacy.startsWith("G0")) {
        gender = "FEMALE";
      } else if (upperLegacy.includes("-B-") || upperLegacy.startsWith("NNVS-B") || upperLegacy.startsWith("B-") || upperLegacy.startsWith("B0")) {
        gender = "MALE";
      } else {
        const genderStr = String(row.gender || "").toLowerCase().trim();
        gender = genderStr === "female" ? "FEMALE" : "MALE";
      }


      // Exact Field Extractions from Payload needed early for matching
      const dateOfBirth = parseDate(row.dob || row.dateOfBirth);

      // Check for Existing Records in Database by Old ID, Legacy ID, Profile ID, or Mobile Number
      let existingProfile: any = null;

      // 1. Match by Old ID / legacyProfileId / oldNnvsId / profileId / sourceId
      if (legacyProfileId) {
        const cleanLegacy = String(legacyProfileId).trim();
        const variations = [cleanLegacy, cleanLegacy.toUpperCase(), cleanLegacy.toLowerCase()];

        // Handle variations: NNVS-B-0504, NNVS-B-504, B-0504, B0504, B-504, etc.
        const numMatch = cleanLegacy.match(/(?:NNVS[- ]*)?([BG])[- ]*0*(\d+)/i);
        if (numMatch) {
          const letter = numMatch[1].toUpperCase();
          const num = parseInt(numMatch[2], 10);
          const padded = String(num).padStart(4, "0");
          variations.push(`NNVS-${letter}-${padded}`);
          variations.push(`NNVS-${letter}-${num}`);
          variations.push(`${letter}-${padded}`);
          variations.push(`${letter}-${num}`);
          variations.push(`${letter}${padded}`);
          variations.push(`NNVS${letter}${padded}`);
        }

        existingProfile = await prisma.profile.findFirst({
          where: {
            OR: [
              { legacyProfileId: { in: variations, mode: "insensitive" } },
              { oldNnvsId: { in: variations, mode: "insensitive" } },
              { profileId: { in: variations, mode: "insensitive" } },
              ...(sourceId ? [{ sourceId }, { oldNnvsId: sourceId }] : []),
            ],
          },
          include: { user: true, family: true, education: true, occupation: true, partnerPreference: true, photos: true, phoneNumbers: true },
        });
      } else if (sourceId) {
        existingProfile = await prisma.profile.findFirst({
          where: {
            OR: [{ sourceId }, { oldNnvsId: sourceId }],
          },
          include: { user: true, family: true, education: true, occupation: true, partnerPreference: true, photos: true, phoneNumbers: true },
        });
      }

      // 2. If not matched by Old ID, match by Mobile Number
      if (!existingProfile && (mobile || allMobiles.length > 0)) {
        const mobilesToCheck = Array.from(new Set([mobile, ...allMobiles].filter((m) => m && !m.startsWith("9900"))));

        if (mobilesToCheck.length > 0) {
          const matchedUsers = await prisma.user.findMany({
            where: {
              OR: mobilesToCheck.flatMap((m) => [
                { mobile: m },
                { mobile: { endsWith: m.slice(-10) } },
              ]),
            },
            include: {
              profiles: {
                include: { user: true, family: true, education: true, occupation: true, partnerPreference: true, photos: true, phoneNumbers: true },
              },
            },
          });

          const matchedPhones = await prisma.profilePhone.findMany({
            where: {
              OR: mobilesToCheck.flatMap((m) => [
                { phone: m },
                { phone: { endsWith: m.slice(-10) } },
              ]),
            },
            include: {
              profile: {
                include: { user: true, family: true, education: true, occupation: true, partnerPreference: true, photos: true, phoneNumbers: true },
              },
            },
          });

          const candidatePool: any[] = [];
          for (const u of matchedUsers) {
            if (u.profiles) {
              for (const p of u.profiles) {
                if (!candidatePool.some((cp) => cp.id === p.id)) candidatePool.push(p);
              }
            }
          }
          for (const ph of matchedPhones) {
            if (ph.profile && !candidatePool.some((cp) => cp.id === ph.profile.id)) {
              candidatePool.push(ph.profile);
            }
          }

          if (candidatePool.length === 1) {
            existingProfile = candidatePool[0];
          } else if (candidatePool.length > 1) {
            // Find best matching candidate by name or gender
            const exactNameMatch = candidatePool.find((p) => checkCandidateDuplicate({ fullName, gender, dateOfBirth }, p));
            if (exactNameMatch) {
              existingProfile = exactNameMatch;
            } else {
              const genderMatch = candidatePool.find((p) => {
                const pGender = p.user?.gender || (p.legacyProfileId?.includes("-G-") ? "FEMALE" : "MALE");
                return pGender === gender;
              });
              existingProfile = genderMatch || candidatePool[0];
            }
          }
        }
      }

      // Check for User Registered Mobile
      let existingUser = existingProfile?.user || null;
      if (!existingUser && mobile) {
        existingUser = await prisma.user.findUnique({
          where: { mobile },
          include: { profiles: { include: { user: true, family: true, education: true, occupation: true, partnerPreference: true } } },
        });

        if (!existingUser) {
          const phoneMatch = await prisma.profilePhone.findFirst({
            where: { phone: mobile },
            include: {
              profile: {
                include: {
                  user: {
                    include: {
                      profiles: { include: { user: true, family: true, education: true, occupation: true, partnerPreference: true } },
                    },
                  },
                },
              },
            },
          });
          if (phoneMatch?.profile?.user) {
            existingUser = phoneMatch.profile.user as any;
          }
        }
      }

      // Sibling / Multi-Profile & Genuine Duplicate Detection
      // If an existing candidate with matching name/details is found under this user/phone,
      // treat this submission as an EDIT / UPDATE to that profile instead of creating a duplicate!
      let duplicateCandidateMatch: any = null;
      if (!existingProfile && existingUser && existingUser.profiles?.length > 0) {
        duplicateCandidateMatch = existingUser.profiles.find((p: any) => {
          return checkCandidateDuplicate({ fullName, gender, dateOfBirth }, p);
        });
        if (duplicateCandidateMatch) {
          existingProfile = duplicateCandidateMatch;
        }
      }

      const isDuplicateCandidate = !existingProfile && Boolean(duplicateCandidateMatch);
      const duplicateMatchedProfileId = duplicateCandidateMatch?.profileId || null;
      const duplicateNotes = isDuplicateCandidate
        ? `Duplicate candidate submission: matches profile ${duplicateCandidateMatch.profileId} (${duplicateCandidateMatch.firstName || ""} ${duplicateCandidateMatch.lastName || ""}) with same contact number ${mobile}.`
        : null;

      if (isDuplicateCandidate) {
        duplicateFlaggedCount++;
      }

      // If DRY RUN: Record analysis and continue without making DB changes
      if (dryRun) {
        if (existingProfile) {
          updatedCount++;
          rowResults.push({
            row: rowIndex,
            status: "WOULD_UPDATE",
            profileId: existingProfile.profileId,
            legacyProfileId: existingProfile.legacyProfileId || legacyProfileId,
            mobile,
            allMobiles,
            fullName,
          });
        } else {
          createdCount++;
          rowResults.push({
            row: rowIndex,
            status: "WOULD_CREATE",
            generatedProfileId: `RC${Date.now()}_${rowIndex}`,
            legacyProfileId,
            mobile,
            allMobiles,
            fullName,
            isSiblingAccount: Boolean(existingUser),
            isDuplicate: isDuplicateCandidate,
          });
        }
        continue;
      }

      // ==========================================
      // REAL COMMIT MODE (Atomic Transactions)
      // ==========================================
      try {
        // Handle Photo Uploads & Google Drive Fallback
        let primaryPhotoUrl: string | null = null;
        const additionalPhotoUrls: string[] = [];

        // 1. Primary Photo Base64 upload to Cloudinary
        const primaryPhotoBase64 = row.primaryPhotoBase64 || row.profilePhotoBase64;
        if (primaryPhotoBase64 && typeof primaryPhotoBase64 === "string" && primaryPhotoBase64.startsWith("data:image/")) {
          primaryPhotoUrl = await uploadToCloudinary(primaryPhotoBase64);
          if (!primaryPhotoUrl) photoFailureCount++;
        }

        // 2. Primary Photo Drive / Direct URL fallback
        if (!primaryPhotoUrl) {
          const rawUrl = row.primaryPhotoUrl || row.photoUrl || row.driveUrl || row.rawPhotoLink || row.photo;
          if (rawUrl) {
            const formatted = formatGoogleDrivePhotoUrl(rawUrl);
            if (formatted) {
              primaryPhotoUrl = formatted.displayUrl;
            }
          }
        }

        // 3. Additional Photos
        const additionalPhotosArray = row.additionalPhotosBase64 || row.photosBase64 || row.additionalPhotoUrls || [];
        if (Array.isArray(additionalPhotosArray)) {
          for (const item of additionalPhotosArray) {
            if (typeof item === "string" && item.startsWith("data:image/")) {
              const url = await uploadToCloudinary(item);
              if (url) additionalPhotoUrls.push(url);
            } else if (item) {
              const formatted = formatGoogleDrivePhotoUrl(item);
              if (formatted && !additionalPhotoUrls.includes(formatted.displayUrl) && formatted.displayUrl !== primaryPhotoUrl) {
                additionalPhotoUrls.push(formatted.displayUrl);
              }
            }
          }
        } else if (typeof additionalPhotosArray === "string" && additionalPhotosArray.startsWith("data:image/")) {
          const url = await uploadToCloudinary(additionalPhotosArray);
          if (url) additionalPhotoUrls.push(url);
        } else if (typeof additionalPhotosArray === "string" && additionalPhotosArray.trim()) {
          const formatted = formatGoogleDrivePhotoUrl(additionalPhotosArray);
          if (formatted && formatted.displayUrl !== primaryPhotoUrl) {
            additionalPhotoUrls.push(formatted.displayUrl);
          }
        }

        // Exact Field Extractions from Payload
        const email = row.email ? String(row.email).trim() : null;
        // dateOfBirth already parsed above for candidate duplicate checking
        const height = normalizeHeight(row.height);
        const maritalStatus = row.maritalStatus || null;
        const birthPlace = row.birthPlace || null;
        const birthTime = row.birthTime || null;
        const diet = row.diet || null;
        const manglik = row.manglik || null;
        const contactPerson = row.contactPerson || null;
        const consentSocialMedia = String(row.consentSocialMedia || "").toLowerCase().includes("yes");
        const consentGeneral = !String(row.consentGeneral || "").toLowerCase().includes("no");
        const otherMatrimonyInfo = row.otherMatrimonyInfo || null;
        const paymentRemark = row.paymentRemark || null;

        // Notes, Address & Gotra Handling
        const rawNotes = (row.notes || row.address || existingProfile?.notes || "").trim();
        let finalNotes = rawNotes;
        const extractedGotra = extractGotraFromRow(row);
        if (extractedGotra) {
          if (!finalNotes) {
            finalNotes = `Gotra: ${extractedGotra}`;
          } else if (/Gotra:\s*[^;\n]+/i.test(finalNotes)) {
            finalNotes = finalNotes.replace(/Gotra:\s*[^;\n]+/i, `Gotra: ${extractedGotra}`);
          } else {
            finalNotes = `${finalNotes}\nGotra: ${extractedGotra}`;
          }
        }

        const caste = row.caste ? String(row.caste).trim() : existingProfile?.caste || null;
        const religion = row.religion ? String(row.religion).trim() : existingProfile?.religion || null;

        // Family Details (Cols Q, R, S, T, U, V, W, X)
        const fatherName = row.fatherName || null;
        const fatherOccupation = row.fatherOccupation || null;
        const motherName = row.motherName || null;
        const motherOccupation = row.motherOccupation || null;
        const siblingsDetails = row.siblingsDetails || "";
        const brothers = extractBrothers(siblingsDetails);
        const sisters = extractSisters(siblingsDetails);
        const familyStatus = row.familyStatus || null;
        const familyType = row.familyType || null;
        const propertyDetails = row.propertyDetails || null;

        // Qualification (Col K), Occupation (Col L), Income (Col M)
        const highestQualification = row.qualification || row.highestQualification || null;
        const profession = row.occupation || row.profession || null;
        const annualIncome = row.income ? String(row.income) : (row.annualIncome ? String(row.annualIncome) : null);

        // Partner Preferences (Col AA)
        const partnerPrefText = row.partnerPreferences || null;

        // 1. User Account (1 Mobile = 1 User Account owning multiple profiles)
        let userId = existingUser?.id;
        if (!userId) {
          let userEmail: string | undefined = undefined;
          if (email) {
            const existingEmailUser = await prisma.user.findUnique({ where: { email } });
            if (!existingEmailUser) userEmail = email;
          }

          // Initial temporary password for imported members: 'NNVS@RC2026' with mustChangePassword flag
          const initialPasswordHash = await bcrypt.hash("NNVS@RC2026", 10);

          const newUser = await prisma.user.create({
            data: {
              fullName,
              mobile,
              email: userEmail,
              gender,
              role: "MEMBER",
              status: "ACTIVE",
              mobileVerified: true,
              password: initialPasswordHash,
              mustChangePassword: true,
              createdAt: parseDate(row.timestamp) || new Date(),
            },
          });
          userId = newUser.id;
        } else {
          let userEmail = existingUser?.email || undefined;
          if (email && email !== existingUser?.email) {
            const existingEmailUser = await prisma.user.findUnique({ where: { email } });
            if (!existingEmailUser) userEmail = email;
          }

          await prisma.user.update({
            where: { id: userId },
            data: {
              fullName: fullName || existingUser?.fullName,
              email: userEmail,
              mobileVerified: true,
              status: "ACTIVE",
            },
          });
        }

        // 2. Profile Creation / Update
        // Rule 2: Official RishteClub Profile ID is assigned upon confirmed payment
        let websiteProfileId = existingProfile?.profileId;
        if (!websiteProfileId || websiteProfileId.startsWith("DRAFT-") || websiteProfileId === "DRAFT") {
          let candidateId = `RC${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
          let idCheck = await prisma.profile.findUnique({ where: { profileId: candidateId } });
          while (idCheck) {
            candidateId = `RC${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
            idCheck = await prisma.profile.findUnique({ where: { profileId: candidateId } });
          }
          websiteProfileId = candidateId;
        }

        // If profile was already approved in RishteClub, preserve its approved & visible status upon edit
        const isAlreadyApproved = existingProfile ? existingProfile.approvalStatus === "APPROVED" : false;
        const isAlreadyVisible = existingProfile ? Boolean(existingProfile.isVisible) : false;

        const profileData: any = {
          firstName: (fullName.split(" ")[0] || fullName) || existingProfile?.firstName,
          lastName: (fullName.split(" ").slice(1).join(" ") || null) || existingProfile?.lastName || null,
          dateOfBirth: dateOfBirth || existingProfile?.dateOfBirth || null,
          height: height || existingProfile?.height || null,
          maritalStatus: maritalStatus || existingProfile?.maritalStatus || null,
          birthPlace: birthPlace || existingProfile?.birthPlace || null,
          birthTime: birthTime || existingProfile?.birthTime || null,
          diet: diet || existingProfile?.diet || null,
          manglik: manglik || existingProfile?.manglik || null,
          contactPerson: contactPerson || existingProfile?.contactPerson || null,
          consentSocialMedia,
          consentGeneral,
          otherMatrimonyInfo: otherMatrimonyInfo || existingProfile?.otherMatrimonyInfo || null,
          caste: caste || existingProfile?.caste || null,
          religion: religion || existingProfile?.religion || null,
          notes: finalNotes || existingProfile?.notes || null,
          paymentRemark: isAlreadyApproved
            ? (paymentRemark || existingProfile?.paymentRemark || "Google Form Sync")
            : (paymentRemark || "Google Form New Submission - Pending Admin Approval & Verification"),
          source: "GOOGLE_FORM",
          sourceId: sourceId || existingProfile?.sourceId || null,
          oldNnvsId: sourceId || legacyProfileId || existingProfile?.oldNnvsId || null,
          legacyProfileId: legacyProfileId || existingProfile?.legacyProfileId || null,
          isVisible: existingProfile ? isAlreadyVisible : false,
          paymentCompleted: true,
          isPaymentExempted: true,
          paymentExemptionReason: "Google Form Legacy / Imported Member",
          approvalStatus: existingProfile ? (isAlreadyApproved ? "APPROVED" : existingProfile.approvalStatus) : "PENDING_APPROVAL",
          approvedAt: isAlreadyApproved ? (existingProfile?.approvedAt || new Date()) : null,
          isDuplicateFlagged: existingProfile ? false : isDuplicateCandidate,
          duplicateMatchedProfileId: existingProfile ? null : (isDuplicateCandidate ? duplicateMatchedProfileId : null),
          duplicateNotes: existingProfile ? null : (isDuplicateCandidate ? duplicateNotes : null),
        };

        let profile;
        if (existingProfile) {
          profile = await prisma.profile.update({
            where: { id: existingProfile.id },
            data: {
              ...profileData,
              profileId: websiteProfileId,
              userId: userId!,
            },
          });
        } else {
          profile = await prisma.profile.create({
            data: {
              ...profileData,
              userId: userId!,
              profileId: websiteProfileId,
            },
          });
        }

        // 3. ProfilePhone: Store all extracted phone numbers
        for (let pIdx = 0; pIdx < allMobiles.length; pIdx++) {
          const ph = allMobiles[pIdx];
          const isPrimary = pIdx === 0;
          await prisma.profilePhone.upsert({
            where: {
              profileId_phone: {
                profileId: profile.id,
                phone: ph,
              },
            },
            create: {
              profileId: profile.id,
              phone: ph,
              isPrimary,
            },
            update: {
              isPrimary,
            },
          });
        }

        // 4. Family Details
        await prisma.family.upsert({
          where: { profileId: profile.id },
          create: {
            profileId: profile.id,
            fatherName,
            fatherOccupation,
            motherName,
            motherOccupation,
            brothers,
            sisters,
            siblingsDetails,
            familyStatus,
            familyType,
            propertyDetails,
          },
          update: {
            fatherName: fatherName || undefined,
            fatherOccupation: fatherOccupation || undefined,
            motherName: motherName || undefined,
            motherOccupation: motherOccupation || undefined,
            brothers: brothers || undefined,
            sisters: sisters || undefined,
            siblingsDetails: siblingsDetails || undefined,
            familyStatus: familyStatus || undefined,
            familyType: familyType || undefined,
            propertyDetails: propertyDetails || undefined,
          },
        });

        // 5. Education
        if (highestQualification || !existingProfile) {
          await prisma.education.upsert({
            where: { profileId: profile.id },
            create: {
              profileId: profile.id,
              highestQualification,
              occupationField: profession,
            },
            update: {
              highestQualification: highestQualification || undefined,
              occupationField: profession || undefined,
            },
          });
        }

        // 6. Occupation
        if (profession || annualIncome || !existingProfile) {
          await prisma.occupation.upsert({
            where: { profileId: profile.id },
            create: {
              profileId: profile.id,
              profession,
              annualIncome,
            },
            update: {
              profession: profession || undefined,
              annualIncome: annualIncome || undefined,
            },
          });
        }

        // 7. Partner Preference
        if (partnerPrefText) {
          await prisma.partnerPreference.upsert({
            where: { profileId: profile.id },
            create: {
              profileId: profile.id,
              preferredCaste: partnerPrefText,
            },
            update: {
              preferredCaste: partnerPrefText,
            },
          });
        }

        // 8. Photos (Idempotent insertion with APPROVED status)
        if (primaryPhotoUrl) {
          const existingPrimary = await prisma.profilePhoto.findFirst({
            where: {
              profileId: profile.id,
              imageUrl: primaryPhotoUrl,
            },
          });

          if (!existingPrimary) {
            await prisma.profilePhoto.create({
              data: {
                profileId: profile.id,
                imageUrl: primaryPhotoUrl,
                isPrimary: true,
                status: "APPROVED",
              },
            });
          } else {
            await prisma.profilePhoto.update({
              where: { id: existingPrimary.id },
              data: { isPrimary: true, status: "APPROVED" },
            });
          }
        }

        for (const addUrl of additionalPhotoUrls) {
          const existingPhoto = await prisma.profilePhoto.findFirst({
            where: {
              profileId: profile.id,
              imageUrl: addUrl,
            },
          });

          if (!existingPhoto) {
            await prisma.profilePhoto.create({
              data: {
                profileId: profile.id,
                imageUrl: addUrl,
                isPrimary: false,
                status: "APPROVED",
              },
            });
          }
        }

        // 9. Payment Record for Google Form Imports (Only existing approved legacy profiles get auto payment-exempt record)
        if (isAlreadyApproved && userId) {
          const existingPayment = await prisma.payment.findFirst({
            where: {
              OR: [
                { profileId: profile.id },
                { userId: userId },
              ],
            },
          });
          if (!existingPayment) {
            await prisma.payment.create({
              data: {
                userId: userId,
                profileId: profile.id,
                amount: 0,
                grossAmount: 0,
                taxableAmount: 0,
                gstRate: 0,
                gstAmount: 0,
                status: "SUCCESS",
                paymentGateway: "PAYMENT_EXEMPT",
                paymentDate: parseDate(row.timestamp) || new Date(),
                adminNotes: "NNVS Old Profile - Fees Exempted (Old Registered Candidate)",
                confirmedByAdmin: true,
                confirmedAt: new Date(),
              },
            });
          } else {
            await prisma.payment.update({
              where: { id: existingPayment.id },
              data: {
                paymentGateway: "PAYMENT_EXEMPT",
                status: "SUCCESS",
                adminNotes: "NNVS Old Profile - Fees Exempted (Old Registered Candidate)",
                confirmedByAdmin: true,
              },
            });
          }
        }

        // Automated PDF Generation for paid Google Form candidates
        try {
          await autoGenerateAndSaveBiodataPdf(profile.id);
        } catch (err) {
          console.error(`[Auto PDF generation on Google Form sync failed for ${profile.profileId}]:`, err);
        }

        if (existingProfile) {
          updatedCount++;
        } else {
          createdCount++;
        }

        rowResults.push({
          row: rowIndex,
          status: existingProfile ? "UPDATED" : "CREATED",
          profileId: profile.profileId,
          legacyProfileId: profile.legacyProfileId,
          mobile,
          allMobiles,
          fullName,
          isDuplicateFlagged: profile.isDuplicateFlagged,
        });
      } catch (rowErr: any) {
        console.error(`Error processing row ${rowIndex}:`, rowErr);
        skippedCount++;
        rowResults.push({
          row: rowIndex,
          status: "ERROR",
          error: rowErr?.message || "Internal database transaction error.",
          mobile,
          legacyProfileId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      summary: {
        totalRows: rows.length,
        created: createdCount,
        updated: updatedCount,
        skipped: skippedCount,
        missingMobile: missingMobileCount,
        photoFailures: photoFailureCount,
        duplicateFlagged: duplicateFlaggedCount,
      },
      results: rowResults,
    });
  } catch (error: any) {
    console.error("GOOGLE FORM INTEGRATION API ERROR =>", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Integration error." },
      { status: 500 }
    );
  }
}

/**
 * Dedicated, idempotent photo repair handler for existing Google Form profiles.
 * - Does NOT create or modify Users or Profiles.
 * - Does NOT alter profile IDs, legacy IDs, payments, invoices, or visibility.
 * - Matches existing profiles by sourceId, legacyProfileId, or mobile.
 * - Uploads base64 image data to Cloudinary and attaches ProfilePhoto if missing.
 */
async function handlePhotoRepair(body: any) {
  const items: any[] = Array.isArray(body.batch)
    ? body.batch
    : Array.isArray(body.rows)
    ? body.rows
    : body.row
    ? [body.row]
    : [];

  if (items.length === 0) {
    return NextResponse.json(
      { success: false, message: "No items provided for photo repair." },
      { status: 400 }
    );
  }

  let photosProcessed = 0;
  let photosAttached = 0;
  let skippedNoPhoto = 0;
  let skippedProfileNotFound = 0;
  let skippedAlreadyAttached = 0;
  let cloudinaryErrors = 0;

  const results: any[] = [];

  for (const item of items) {
    photosProcessed++;
    const rowIndex = item.rowNumber || item.rowIndex;
    const sourceId = item.sourceId;
    const legacyProfileId = item.legacyProfileId ? String(item.legacyProfileId).trim() : null;
    const rawMobile = item.mobile || item.contactNo;
    const parsed = extractIndianMobiles(rawMobile);
    const mobile = parsed.primary;
    const photoBase64 = item.primaryPhotoBase64 || item.photoBase64 || item.profilePhotoBase64;
    const additionalPhotos: string[] = Array.isArray(item.additionalPhotosBase64)
      ? item.additionalPhotosBase64
      : Array.isArray(item.photosBase64)
      ? item.photosBase64
      : [];

    // Priority match:
    // 1. sourceId
    // 2. legacyProfileId (Col A)
    // 3. registered mobile (Col Z)
    let existingProfile: any = null;

    if (sourceId) {
      existingProfile = await prisma.profile.findUnique({
        where: { sourceId },
        include: { photos: true },
      });
    }

    if (!existingProfile && legacyProfileId) {
      existingProfile = await prisma.profile.findFirst({
        where: { legacyProfileId },
        include: { photos: true },
      });
    }

    if (!existingProfile && mobile) {
      const user = await prisma.user.findUnique({
        where: { mobile },
        include: { profiles: { include: { photos: true } } },
      });
      if (user?.profiles && user.profiles.length > 0) {
        existingProfile = user.profiles[0];
      }
    }

    if (!existingProfile) {
      skippedProfileNotFound++;
      results.push({
        row: rowIndex,
        status: "PROFILE_NOT_FOUND",
        legacyProfileId,
        mobile,
        reason: "No matching profile found in database",
      });
      continue;
    }

    if (!photoBase64 && additionalPhotos.length === 0) {
      skippedNoPhoto++;
      results.push({
        row: rowIndex,
        profileId: existingProfile.profileId,
        legacyProfileId: existingProfile.legacyProfileId,
        status: "NO_PHOTO_PROVIDED",
        reason: "Column AC was blank or image could not be read",
      });
      continue;
    }

    // Check existing photos count
    const currentPhotos = existingProfile.photos || [];
    const hasPrimaryPhoto = currentPhotos.some((p: any) => p.isPrimary);

    if (hasPrimaryPhoto && currentPhotos.length > 0) {
      skippedAlreadyAttached++;
      results.push({
        row: rowIndex,
        profileId: existingProfile.profileId,
        legacyProfileId: existingProfile.legacyProfileId,
        status: "ALREADY_ATTACHED",
        reason: `Profile already has ${currentPhotos.length} photo(s) attached`,
      });
      continue;
    }

    // Prepare photos to upload
    const photosToUpload: { base64: string; isPrimary: boolean }[] = [];
    if (photoBase64) {
      photosToUpload.push({ base64: photoBase64, isPrimary: true });
    }

    for (let pIdx = 0; pIdx < additionalPhotos.length; pIdx++) {
      const addB64 = additionalPhotos[pIdx];
      if (addB64) {
        photosToUpload.push({
          base64: addB64,
          isPrimary: photosToUpload.length === 0,
        });
      }
    }

    let attachedForThisProfile = 0;
    for (let i = 0; i < photosToUpload.length; i++) {
      const p = photosToUpload[i];
      let finalImageUrl: string | null = null;
      if (p.base64 && p.base64.startsWith("data:image/")) {
        finalImageUrl = await uploadToCloudinary(p.base64);
      }

      if (!finalImageUrl) {
        // Fallback to Drive URL
        const rawDrive = item.primaryPhotoUrl || item.photoUrl || item.driveUrl || item.rawPhotoLink;
        const formatted = formatGoogleDrivePhotoUrl(rawDrive);
        if (formatted) {
          finalImageUrl = formatted.displayUrl;
        }
      }

      if (!finalImageUrl) {
        cloudinaryErrors++;
        continue;
      }

      await prisma.profilePhoto.create({
        data: {
          profileId: existingProfile.id,
          imageUrl: finalImageUrl,
          isPrimary: p.isPrimary,
          status: "PENDING",
        },
      });

      attachedForThisProfile++;
      photosAttached++;
    }

    // If no base64 was sent but a direct drive link was provided in item
    if (attachedForThisProfile === 0 && (item.primaryPhotoUrl || item.photoUrl || item.driveUrl || item.rawPhotoLink)) {
      const formatted = formatGoogleDrivePhotoUrl(item.primaryPhotoUrl || item.photoUrl || item.driveUrl || item.rawPhotoLink);
      if (formatted) {
        await prisma.profilePhoto.create({
          data: {
            profileId: existingProfile.id,
            imageUrl: formatted.displayUrl,
            isPrimary: true,
            status: "PENDING",
          },
        });
        attachedForThisProfile++;
        photosAttached++;
      }
    }

    if (attachedForThisProfile > 0) {
      results.push({
        row: rowIndex,
        profileId: existingProfile.profileId,
        legacyProfileId: existingProfile.legacyProfileId,
        status: "PHOTO_ATTACHED",
        attachedCount: attachedForThisProfile,
      });
    } else {
      results.push({
        row: rowIndex,
        profileId: existingProfile.profileId,
        legacyProfileId: existingProfile.legacyProfileId,
        status: "CLOUDINARY_ERROR",
        reason: "Failed to upload photo to Cloudinary and no valid Drive link available",
      });
    }
  }

  return NextResponse.json({
    success: true,
    action: "repair_photos",
    photosProcessed,
    photosAttached,
    skippedNoPhoto,
    skippedProfileNotFound,
    skippedAlreadyAttached,
    cloudinaryErrors,
    results,
  });
}
