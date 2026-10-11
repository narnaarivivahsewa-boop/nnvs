import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { extractIndianMobiles, formatGoogleDrivePhotoUrl } from "@/lib/integrations/google-sync-helpers";

function parseDate(val: any): Date | null {
  if (!val) return null;
  if (typeof val === "number" || (!isNaN(Number(val)) && !String(val).includes("-") && !String(val).includes("/"))) {
    const num = Number(val);
    if (num > 1000 && num < 60000) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      return new Date(excelEpoch.getTime() + num * 86400000);
    }
  }
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

function normalizeHeight(raw: any): string | null {
  if (!raw) return null;
  const str = String(raw).trim();
  const feetInchesMatch = str.match(/^(\d+)\s*['’]\s*(\d+)\s*["”]?$/);
  if (feetInchesMatch) return `${feetInchesMatch[1]}'${feetInchesMatch[2]}"`;
  const wordsMatch = str.match(/^(\d+)\s*(?:feet|foot|ft)\s*(\d+)\s*(?:inches|inch|in)?$/i);
  if (wordsMatch) return `${wordsMatch[1]}'${wordsMatch[2]}"`;
  const feetOnlyMatch = str.match(/^(\d+)\s*(?:feet|foot|ft)$/i);
  if (feetOnlyMatch) return `${feetOnlyMatch[1]}'0"`;
  return str;
}

function extractBrothers(text: string): number {
  const match = text.match(/(\d+)\s*brother/i);
  return match ? parseInt(match[1], 10) : 0;
}

function extractSisters(text: string): number {
  const match = text.match(/(\d+)\s*sister/i);
  return match ? parseInt(match[1], 10) : 0;
}

async function main() {
  console.log("==================================================");
  console.log("NNVS ALL PROFILES IMPORT - 100% INGESTION & LIVE");
  console.log("==================================================");

  const wb = XLSX.readFile("NNVS (Responses).xlsx");
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  console.log(`Total rows in Excel: ${rawData.length}`);

  let createdCount = 0;
  let errorCount = 0;

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    const rowIndex = i + 1;

    // Check if totally empty
    if (!row || row.length === 0 || row.every((c) => c === undefined || c === null || String(c).trim() === "")) {
      continue;
    }

    const getCol = (idx: number) => {
      return row[idx] !== undefined && row[idx] !== null ? String(row[idx]).trim() : "";
    };

    const legacyProfileId = getCol(0) || null;
    const timestampStr = getCol(1);
    const email = getCol(2) ? getCol(2).toLowerCase() : null;
    let fullName = getCol(3);
    const genderStr = getCol(4).toLowerCase();
    const gender = genderStr === "female" ? "FEMALE" : "MALE";
    const maritalStatus = getCol(5) || null;
    const dob = parseDate(getCol(6));
    const birthPlace = getCol(7) || null;
    const birthTime = getCol(8) || null;
    const height = normalizeHeight(getCol(9));
    const qualification = getCol(10) || null;
    const occupation = getCol(11) || null;
    const income = getCol(12) || null;
    const address = getCol(13) || null;
    const diet = getCol(14) || null;
    const manglik = getCol(15) || null;
    const fatherName = getCol(16) || null;
    const fatherOccupation = getCol(17) || null;
    const motherName = getCol(18) || null;
    const motherOccupation = getCol(19) || null;
    const siblingsDetails = getCol(20) || "";
    const brothers = extractBrothers(siblingsDetails);
    const sisters = extractSisters(siblingsDetails);
    const familyStatus = getCol(21) || null;
    const familyType = getCol(22) || null;
    const propertyDetails = getCol(23) || null;
    const contactPerson = getCol(24) || null;
    let rawMobile = getCol(25);
    const partnerPreferences = getCol(26) || null;
    const consentSocialMedia = getCol(27).toLowerCase().includes("yes");
    const photoColRaw = getCol(28);
    const consentGeneral = !getCol(29).toLowerCase().includes("no");
    const otherMatrimonyInfo = getCol(30) || null;
    const notes = getCol(31) || address || null;
    const paymentRemark = getCol(32) || null;

    if (!rawMobile) {
      const fallbackText = `${contactPerson} ${notes} ${address}`;
      const fallbackParsed = extractIndianMobiles(fallbackText);
      if (fallbackParsed.primary) {
        rawMobile = fallbackParsed.primary;
      }
    }

    const parsedMobiles = extractIndianMobiles(rawMobile);
    let primaryMobile = parsedMobiles.primary;
    let allMobiles = parsedMobiles.all;

    if (!primaryMobile) {
      primaryMobile = `9900${String(rowIndex).padStart(6, "0")}`;
      if (rawMobile && !allMobiles.includes(rawMobile)) {
        allMobiles.push(rawMobile);
      }
    }

    if (!fullName) {
      fullName = legacyProfileId ? `Applicant (${legacyProfileId})` : `Applicant (Row ${rowIndex})`;
    }

    const sourceId = `LOCAL_EXCEL_ROW_${rowIndex}`;

    try {
      await prisma.$transaction(async (tx) => {
        // Find if user already exists
        let existingUser = await tx.user.findUnique({ where: { mobile: primaryMobile } });
        let effectiveMobile = primaryMobile;
        let isShared = false;

        if (existingUser) {
          isShared = true;
          effectiveMobile = `${primaryMobile}_r${rowIndex}`;
          let checkColl = await tx.user.findUnique({ where: { mobile: effectiveMobile } });
          if (checkColl) {
            effectiveMobile = `${effectiveMobile}_${Date.now()}`;
          }
        }

        let userEmail: string | undefined = undefined;
        if (email) {
          const emailCheck = await tx.user.findUnique({ where: { email } });
          if (!emailCheck) userEmail = email;
        }

        const newUser = await tx.user.create({
          data: {
            fullName,
            mobile: effectiveMobile,
            email: userEmail,
            gender,
            role: "MEMBER",
            status: "ACTIVE",
            mobileVerified: true,
            createdAt: parseDate(timestampStr) || new Date(),
          },
        });

        let websiteProfileId = `RC${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
        let idCheck = await tx.profile.findUnique({ where: { profileId: websiteProfileId } });
        while (idCheck) {
          websiteProfileId = `RC${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
          idCheck = await tx.profile.findUnique({ where: { profileId: websiteProfileId } });
        }

        const newProfile = await tx.profile.create({
          data: {
            userId: newUser.id,
            profileId: websiteProfileId,
            legacyProfileId: legacyProfileId,
            source: "GOOGLE_FORM",
            sourceId: sourceId,
            firstName: fullName.split(" ")[0] || fullName,
            lastName: fullName.split(" ").slice(1).join(" ") || null,
            dateOfBirth: dob,
            height: height,
            maritalStatus: maritalStatus,
            birthPlace: birthPlace,
            birthTime: birthTime,
            diet: diet,
            manglik: manglik,
            contactPerson: contactPerson,
            consentSocialMedia: consentSocialMedia,
            consentGeneral: consentGeneral,
            otherMatrimonyInfo: otherMatrimonyInfo,
            notes: notes,
            paymentRemark: paymentRemark,
            isVisible: true,
            paymentCompleted: true,
            approvalStatus: "APPROVED",
            approvedAt: new Date(),
            isDuplicateFlagged: isShared,
            duplicateNotes: isShared ? `Shared contact number ${primaryMobile}` : null,
          },
        });

        // Phones
        for (let p = 0; p < allMobiles.length; p++) {
          await tx.profilePhone.create({
            data: {
              profileId: newProfile.id,
              phone: allMobiles[p],
              isPrimary: p === 0,
            },
          });
        }

        // Family
        await tx.family.create({
          data: {
            profileId: newProfile.id,
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
        });

        // Education
        if (qualification) {
          await tx.education.create({
            data: {
              profileId: newProfile.id,
              highestQualification: qualification,
              occupationField: occupation,
            },
          });
        }

        // Occupation
        if (occupation || income) {
          await tx.occupation.create({
            data: {
              profileId: newProfile.id,
              profession: occupation,
              annualIncome: income,
            },
          });
        }

        // Partner Preference
        if (partnerPreferences) {
          await tx.partnerPreference.create({
            data: {
              profileId: newProfile.id,
              preferredCaste: partnerPreferences,
            },
          });
        }

        // Photos
        if (photoColRaw) {
          const formatted = formatGoogleDrivePhotoUrl(photoColRaw);
          if (formatted) {
            await tx.profilePhoto.create({
              data: {
                profileId: newProfile.id,
                imageUrl: formatted.displayUrl,
                isPrimary: true,
                status: "APPROVED",
              },
            });
          }
        }

        // Payment (₹0 Exempt)
        await tx.payment.create({
          data: {
            userId: newUser.id,
            profileId: newProfile.id,
            amount: 0,
            grossAmount: 0,
            taxableAmount: 0,
            gstRate: 0,
            gstAmount: 0,
            status: "SUCCESS",
            paymentGateway: "PAYMENT_EXEMPT",
            paymentDate: parseDate(timestampStr) || new Date(),
            adminNotes: "Imported legacy NNVS profile - Payment Exempt (₹0)",
            confirmedByAdmin: true,
            confirmedAt: new Date(),
          },
        });
      });

      createdCount++;
      if (createdCount % 50 === 0 || i === rawData.length - 1) {
        console.log(`Processed row ${rowIndex}/${rawData.length} (Created: ${createdCount})`);
      }
    } catch (err: any) {
      errorCount++;
      console.error(`Row ${rowIndex} Failed:`, err?.message || err);
    }
  }

  console.log("==================================================");
  console.log(`IMPORT FINISHED: ${createdCount} created, ${errorCount} errors.`);
  console.log("==================================================");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
