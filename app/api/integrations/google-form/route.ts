import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";

const INTEGRATION_KEY_HEADER = "x-integration-key";

// Helper to authenticate request - requires configured environment secret
function authenticateRequest(req: NextRequest): { authenticated: boolean; error?: string } {
  const configuredKey = process.env.GOOGLE_FORM_INTEGRATION_KEY;

  if (!configuredKey || configuredKey.trim() === "") {
    return {
      authenticated: false,
      error: "Server configuration error: GOOGLE_FORM_INTEGRATION_KEY environment variable is not set.",
    };
  }

  const authHeader = req.headers.get("authorization");
  const customHeader = req.headers.get(INTEGRATION_KEY_HEADER);

  if (customHeader && customHeader.trim() === configuredKey.trim()) {
    return { authenticated: true };
  }

  if (authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
      if (parts[1].trim() === configuredKey.trim()) {
        return { authenticated: true };
      }
    }
  }

  return { authenticated: false, error: "Unauthorized integration request. Invalid or missing secret key." };
}

// Clean and normalize 10-digit Indian mobile number
function cleanMobileNumber(raw: any): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\.0$/, "").replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return digits;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    const sliced = digits.slice(2);
    if (/^[6-9]\d{9}$/.test(sliced)) return sliced;
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    const sliced = digits.slice(1);
    if (/^[6-9]\d{9}$/.test(sliced)) return sliced;
  }
  return null;
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

// Parse dates safely
function parseDate(val: any): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

// Upload base64 image data to Cloudinary
async function uploadToCloudinary(base64Data: string, folder: string = "nnvs-matrimony/profile-photos"): Promise<string | null> {
  try {
    if (!base64Data || !base64Data.startsWith("data:image/")) return null;
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

    const rowResults: any[] = [];

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = row.rowNumber || row.rowIndex || i + 1;

      // Source Identifiers
      const sourceId = row.sourceId || `SHEET_ROW_${rowIndex}`;
      const legacyProfileId = row.legacyProfileId ? String(row.legacyProfileId).trim() : null;

      // Registered Mobile (Col Z / index 25)
      const rawMobile = row.mobile || row.contactNo;
      const mobile = cleanMobileNumber(rawMobile);
      const fullName = String(row.name || "").trim();
      const email = row.email ? String(row.email).trim().toLowerCase() : null;
      const genderStr = String(row.gender || "").toLowerCase().trim();
      const gender = genderStr === "female" ? "FEMALE" : "MALE";

      if (!mobile) {
        missingMobileCount++;
        skippedCount++;
        rowResults.push({
          row: rowIndex,
          status: "SKIPPED",
          reason: `Missing or invalid 10-digit registered mobile number: '${rawMobile}'`,
          legacyProfileId,
        });
        continue;
      }

      if (!fullName) {
        skippedCount++;
        rowResults.push({
          row: rowIndex,
          status: "SKIPPED",
          reason: "Missing candidate name.",
          mobile,
          legacyProfileId,
        });
        continue;
      }

      // Check for Existing Records in Database
      let existingProfile = null;

      // 1. Match by sourceId
      existingProfile = await prisma.profile.findUnique({
        where: { sourceId },
        include: { user: true, family: true, education: true, occupation: true, partnerPreference: true },
      });

      // 2. Match by legacyProfileId (if present in Sheet Column A)
      if (!existingProfile && legacyProfileId) {
        existingProfile = await prisma.profile.findUnique({
          where: { legacyProfileId },
          include: { user: true, family: true, education: true, occupation: true, partnerPreference: true },
        });
      }

      // 3. Match by User Registered Mobile (Column Z)
      const existingUser = await prisma.user.findUnique({
        where: { mobile },
        include: { profile: { include: { family: true, education: true, occupation: true, partnerPreference: true } } },
      });

      if (!existingProfile && existingUser?.profile) {
        existingProfile = existingUser.profile as any;
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
            fullName,
          });
        }
        continue;
      }

      // ==========================================
      // REAL COMMIT MODE (Atomic Transactions)
      // ==========================================
      try {
        // Handle Cloudinary Photo Uploads
        let primaryPhotoUrl: string | null = null;
        const additionalPhotoUrls: string[] = [];

        const primaryPhotoBase64 = row.primaryPhotoBase64 || row.profilePhotoBase64;
        if (primaryPhotoBase64) {
          primaryPhotoUrl = await uploadToCloudinary(primaryPhotoBase64);
          if (!primaryPhotoUrl) photoFailureCount++;
        }

        const additionalPhotosArray = row.additionalPhotosBase64 || row.photosBase64 || [];
        if (Array.isArray(additionalPhotosArray)) {
          for (const item of additionalPhotosArray) {
            const url = await uploadToCloudinary(item);
            if (url) additionalPhotoUrls.push(url);
          }
        } else if (typeof additionalPhotosArray === "string" && additionalPhotosArray.startsWith("data:image/")) {
          const url = await uploadToCloudinary(additionalPhotosArray);
          if (url) additionalPhotoUrls.push(url);
        }

        // Exact Field Extractions from Payload (No invented columns)
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

        // Execute Transaction
        const transactionResult = await prisma.$transaction(async (tx) => {
          // 1. User Account
          let userId = existingUser?.id;
          if (!userId) {
            const newUser = await tx.user.create({
              data: {
                fullName,
                mobile,
                email: email || undefined,
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
            await tx.user.update({
              where: { id: userId },
              data: {
                fullName: fullName || existingUser?.fullName,
                email: email || existingUser?.email,
                mobileVerified: true,
              },
            });
          }

          // 2. Profile Creation / Update
          const websiteProfileId = existingProfile?.profileId || `RC${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

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
            paymentRemark,
            source: "GOOGLE_FORM",
            sourceId,
            legacyProfileId: legacyProfileId || existingProfile?.legacyProfileId || null,
            // Google Form imported profiles start as non-public (UNDER_REVIEW, isVisible=false, paymentCompleted=false)
            isVisible: existingProfile ? existingProfile.isVisible : false,
            paymentCompleted: existingProfile ? existingProfile.paymentCompleted : false,
            approvalStatus: existingProfile ? existingProfile.approvalStatus : "UNDER_REVIEW",
          };

          let profile;
          if (existingProfile) {
            profile = await tx.profile.update({
              where: { id: existingProfile.id },
              data: profileData,
            });
          } else {
            profile = await tx.profile.create({
              data: {
                ...profileData,
                userId,
                profileId: websiteProfileId,
              },
            });
          }

          // 3. ProfilePhone
          await tx.profilePhone.upsert({
            where: {
              profileId_phone: {
                profileId: profile.id,
                phone: mobile,
              },
            },
            create: {
              profileId: profile.id,
              phone: mobile,
              isPrimary: true,
            },
            update: {
              isPrimary: true,
            },
          });

          // 4. Family Details
          await tx.family.upsert({
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
            await tx.education.upsert({
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
            await tx.occupation.upsert({
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
            await tx.partnerPreference.upsert({
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

          // 8. Photos (Idempotent insertion)
          if (primaryPhotoUrl) {
            const existingPrimary = await tx.profilePhoto.findFirst({
              where: {
                profileId: profile.id,
                imageUrl: primaryPhotoUrl,
              },
            });

            if (!existingPrimary) {
              await tx.profilePhoto.create({
                data: {
                  profileId: profile.id,
                  imageUrl: primaryPhotoUrl,
                  isPrimary: true,
                  status: "PENDING",
                },
              });
            } else if (!existingPrimary.isPrimary) {
              await tx.profilePhoto.update({
                where: { id: existingPrimary.id },
                data: { isPrimary: true },
              });
            }
          }

          for (const addUrl of additionalPhotoUrls) {
            const existingPhoto = await tx.profilePhoto.findFirst({
              where: {
                profileId: profile.id,
                imageUrl: addUrl,
              },
            });

            if (!existingPhoto) {
              await tx.profilePhoto.create({
                data: {
                  profileId: profile.id,
                  imageUrl: addUrl,
                  isPrimary: false,
                  status: "PENDING",
                },
              });
            }
          }

          return { userId, profile };
        });

        if (existingProfile) {
          updatedCount++;
        } else {
          createdCount++;
        }

        rowResults.push({
          row: rowIndex,
          status: existingProfile ? "UPDATED" : "CREATED",
          profileId: transactionResult.profile.profileId,
          legacyProfileId: transactionResult.profile.legacyProfileId,
          mobile,
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
