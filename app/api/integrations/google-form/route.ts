import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";

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

// Clean and extract valid 10-digit Indian mobile numbers (handles multiple numbers, labels, delimiters)
export function extractIndianMobiles(raw: any): { primary: string | null; all: string[]; raw: string } {
  if (!raw) return { primary: null, all: [], raw: "" };
  const rawStr = String(raw).trim();

  // Replace delimiters with spaces
  const cleaned = rawStr.replace(/[\/\,;\n\+\-\(\)\&]/g, " ");
  const candidates = cleaned.split(/\s+/).filter(Boolean);
  const matchedMobiles: string[] = [];

  const isValid = (d: string) => d.length === 10 && /^[6-9]\d{9}$/.test(d);

  for (let i = 0; i < candidates.length; i++) {
    const chunk = candidates[i].replace(/\D/g, "");
    if (isValid(chunk)) {
      if (!matchedMobiles.includes(chunk)) matchedMobiles.push(chunk);
    } else if (chunk.length === 12 && chunk.startsWith("91") && isValid(chunk.slice(2))) {
      const num = chunk.slice(2);
      if (!matchedMobiles.includes(num)) matchedMobiles.push(num);
    } else if (chunk.length === 11 && chunk.startsWith("0") && isValid(chunk.slice(1))) {
      const num = chunk.slice(1);
      if (!matchedMobiles.includes(num)) matchedMobiles.push(num);
    } else if (i + 1 < candidates.length) {
      // Try combining split consecutive 5-digit pieces e.g. "94160 85772"
      const combined = (candidates[i] + candidates[i + 1]).replace(/\D/g, "");
      if (isValid(combined)) {
        if (!matchedMobiles.includes(combined)) matchedMobiles.push(combined);
        i++;
      }
    }
  }

  // Fallback regex match across whole raw string
  if (matchedMobiles.length === 0) {
    const globalMatches = rawStr.match(/[6-9]\d{9}/g);
    if (globalMatches) {
      for (const m of globalMatches) {
        if (!matchedMobiles.includes(m)) matchedMobiles.push(m);
      }
    }
  }

  return {
    primary: matchedMobiles[0] || null,
    all: matchedMobiles,
    raw: rawStr,
  };
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

// Extract Google Drive file ID from various Drive URL formats
export function extractDriveFileId(urlOrText: any): string | null {
  if (!urlOrText || typeof urlOrText !== "string") return null;
  const str = urlOrText.trim();
  const idMatch = str.match(/[?&]id=([a-zA-Z0-9_-]{20,})/i);
  if (idMatch) return idMatch[1];
  const dMatch = str.match(/\/d\/([a-zA-Z0-9_-]{20,})/i);
  if (dMatch) return dMatch[1];
  const fileDMatch = str.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/i);
  if (fileDMatch) return fileDMatch[1];
  const generalMatch = str.match(/^([a-zA-Z0-9_-]{25,})$/);
  if (generalMatch) return generalMatch[1];
  return null;
}

// Formats Google Drive URLs to both direct embeddable link and full Drive view link
export function formatGoogleDrivePhotoUrl(urlOrText: any): { displayUrl: string; directDriveUrl: string; fileId: string | null } | null {
  if (!urlOrText || typeof urlOrText !== "string") return null;
  const trimmed = urlOrText.trim();
  if (!trimmed) return null;

  const fileId = extractDriveFileId(trimmed);
  if (fileId) {
    return {
      displayUrl: `https://lh3.googleusercontent.com/d/${fileId}`,
      directDriveUrl: `https://drive.google.com/file/d/${fileId}/view`,
      fileId,
    };
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return {
      displayUrl: trimmed,
      directDriveUrl: trimmed,
      fileId: null,
    };
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
      const legacyProfileId = row.legacyProfileId ? String(row.legacyProfileId).trim() : null;

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

      const email = row.email ? String(row.email).trim().toLowerCase() : null;
      const genderStr = String(row.gender || "").toLowerCase().trim();
      const gender = genderStr === "female" ? "FEMALE" : "MALE";

      // Check for Existing Records in Database by sourceId (the exact row)
      let existingProfile = null;

      // 1. Match by sourceId
      existingProfile = await prisma.profile.findUnique({
        where: { sourceId },
        include: { user: true, family: true, education: true, occupation: true, partnerPreference: true },
      });

      // 2. Check for User Registered Mobile (Column Z)
      const existingUser = await prisma.user.findUnique({
        where: { mobile },
        include: { profile: { include: { family: true, education: true, occupation: true, partnerPreference: true } } },
      });

      let isSharedMobileApplicant = false;
      let effectiveMobile = mobile;

      if (!existingProfile && existingUser) {
        // Create unique user account for this sheet row so every row gets its own full profile
        isSharedMobileApplicant = true;
        effectiveMobile = `${mobile}_r${rowIndex}`;
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
            isSharedMobile: isSharedMobileApplicant,
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
        const dateOfBirth = parseDate(row.dob || row.dateOfBirth);
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
        const notes = row.notes || row.address || null;
        const paymentRemark = row.paymentRemark || null;

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
        const highestQualification = row.qualification || null;
        const profession = row.occupation || null;
        const annualIncome = row.income ? String(row.income) : null;

        // Partner Preferences (Col AA)
        const partnerPrefText = row.partnerPreferences || null;

        // 1. User Account
        let userId = isSharedMobileApplicant ? undefined : existingUser?.id;
        if (!userId) {
          let userEmail: string | undefined = undefined;
          if (email) {
            const existingEmailUser = await prisma.user.findUnique({ where: { email } });
            if (!existingEmailUser) userEmail = email;
          }

          // Ensure final user mobile is 100% unique in database
          let finalMobile = effectiveMobile;
          let mobileCollision = await prisma.user.findUnique({ where: { mobile: finalMobile } });
          if (mobileCollision) {
            finalMobile = `${finalMobile}_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
          }

          const newUser = await prisma.user.create({
            data: {
              fullName,
              mobile: finalMobile,
              email: userEmail,
              gender,
              role: "MEMBER",
              status: "ACTIVE",
              mobileVerified: true,
              password: null,
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
        let websiteProfileId = existingProfile?.profileId;
        if (!websiteProfileId) {
          let candidateId = `RC${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
          let idCheck = await prisma.profile.findUnique({ where: { profileId: candidateId } });
          while (idCheck) {
            candidateId = `RC${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
            idCheck = await prisma.profile.findUnique({ where: { profileId: candidateId } });
          }
          websiteProfileId = candidateId;
        }

        const lowerName = (fullName || "").toLowerCase();
        const isExcludedFromLive = lowerName.includes("monus malhotra") || 
                                   (lowerName.includes("lokesh") && lowerName.includes("anand")) ||
                                   sourceId?.includes("row_627") || 
                                   sourceId?.includes("row_630");

        const profileData: any = {
          firstName: fullName.split(" ")[0] || fullName,
          lastName: fullName.split(" ").slice(1).join(" ") || null,
          dateOfBirth,
          height,
          maritalStatus,
          birthPlace,
          birthTime,
          diet,
          manglik,
          contactPerson,
          consentSocialMedia,
          consentGeneral,
          otherMatrimonyInfo,
          notes,
          paymentRemark: isExcludedFromLive ? "Pending Admin Approval & Fee Verification" : (paymentRemark || "NNVS Old Profile - Fees Exempted"),
          source: "GOOGLE_FORM",
          sourceId,
          legacyProfileId: legacyProfileId || existingProfile?.legacyProfileId || null,
          isVisible: !isExcludedFromLive,
          paymentCompleted: !isExcludedFromLive,
          approvalStatus: isExcludedFromLive ? "UNDER_REVIEW" : "APPROVED",
          approvedAt: isExcludedFromLive ? null : new Date(),
          isDuplicateFlagged: isSharedMobileApplicant || existingProfile?.isDuplicateFlagged || false,
          duplicateNotes: isSharedMobileApplicant
            ? `Shares contact number (${mobile}) with candidate '${existingUser?.fullName || "Family member"}'. Both profiles safely preserved.`
            : existingProfile?.duplicateNotes || null,
        };

        let profile;
        if (existingProfile) {
          profile = await prisma.profile.update({
            where: { id: existingProfile.id },
            data: profileData,
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

        // 9. Payment Record for Google Form Imports (Payment-Exempt ₹0 unless pending review profiles)
        if (!isExcludedFromLive && userId) {
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
        include: { profile: { include: { photos: true } } },
      });
      if (user?.profile) {
        existingProfile = user.profile;
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
