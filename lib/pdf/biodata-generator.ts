import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export interface BiodataProfileInput {
  id: string;
  profileId: string;
  legacyProfileId?: string | null;
  source?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: Date | string | null;
  height?: string | null;
  maritalStatus?: string | null;
  religion?: string | null;
  caste?: string | null;
  motherTongue?: string | null;
  birthPlace?: string | null;
  birthTime?: string | null;
  diet?: string | null;
  manglik?: string | null;
  contactPerson?: string | null;
  notes?: string | null;
  otherMatrimonyInfo?: string | null;
  user?: {
    fullName?: string | null;
    gender?: string | null;
    mobile?: string | null;
    email?: string | null;
  } | null;
  photos?: {
    imageUrl: string;
    isPrimary?: boolean;
  }[];
  family?: {
    fatherName?: string | null;
    fatherOccupation?: string | null;
    motherName?: string | null;
    motherOccupation?: string | null;
    brothers?: number | null;
    sisters?: number | null;
    siblingsDetails?: string | null;
    familyType?: string | null;
    familyStatus?: string | null;
    propertyDetails?: string | null;
  } | null;
  education?: {
    highestQualification?: string | null;
    college?: string | null;
    occupationField?: string | null;
  } | null;
  occupation?: {
    profession?: string | null;
    company?: string | null;
    annualIncome?: string | null;
  } | null;
  partnerPreference?: {
    minAge?: number | null;
    maxAge?: number | null;
    minHeight?: string | null;
    maxHeight?: string | null;
    preferredReligion?: string | null;
    preferredCaste?: string | null;
  } | null;
  phoneNumbers?: {
    phone: string;
    isPrimary?: boolean;
  }[];
}

// Helper to calculate age
function calculateAge(dob?: Date | string | null): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

// Format Date of Birth
function formatDOB(dob?: Date | string | null): string {
  if (!dob) return "-";
  const d = new Date(dob);
  if (isNaN(d.getTime())) return String(dob);
  const day = String(d.getDate()).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

// Fetch image buffer safely with timeout
async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  if (!url) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

/**
 * Generates an elegant, high-impact Matrimonial Biodata PDF Buffer
 */
export async function generateBiodataPdfBuffer(profile: BiodataProfileInput): Promise<Buffer> {
  // Fetch primary photo buffer if available
  let photoBuffer: Buffer | null = null;
  const primaryPhoto = profile.photos?.find((p) => p.isPrimary) || profile.photos?.[0];
  if (primaryPhoto?.imageUrl) {
    photoBuffer = await fetchImageBuffer(primaryPhoto.imageUrl);
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4", // 595.28 x 841.89
        margins: { top: 20, bottom: 20, left: 24, right: 24 },
        info: {
          Title: `Matrimonial Biodata - ${profile.user?.fullName || profile.firstName || "Candidate"}`,
          Author: "Nar Naari Vivah Sewa (RishteClub)",
          Subject: "Verified Matrimonial Biodata",
          Keywords: "Matrimony, Biodata, RishteClub, NNVS, Vivah",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;

      // Color Palette
      const maroon = "#831843"; // Deep Royal Crimson / Maroon
      const gold = "#b45309"; // Regal Amber / Gold
      const darkText = "#1e293b"; // Slate 800
      const mutedText = "#475569"; // Slate 600
      const borderGold = "#d97706";
      const lightBg = "#fffbeb"; // Very light amber/cream
      const sectionHeaderBg = "#881337";

      // 1. Outer Double Decorative Border
      doc.save();
      doc.rect(margin, margin, contentWidth, pageHeight - margin * 2)
        .lineWidth(2)
        .strokeColor(borderGold)
        .stroke();

      doc.rect(margin + 3, margin + 3, contentWidth - 6, pageHeight - margin * 2 - 6)
        .lineWidth(0.75)
        .strokeColor(maroon)
        .stroke();
      doc.restore();

      // Corner Corner Accents
      const cornerSize = 14;
      const drawCorner = (x: number, y: number) => {
        doc.save();
        doc.rect(x, y, cornerSize, cornerSize).fillColor(borderGold).fill();
        doc.restore();
      };
      drawCorner(margin + 4, margin + 4);
      drawCorner(pageWidth - margin - 4 - cornerSize, margin + 4);
      drawCorner(margin + 4, pageHeight - margin - 4 - cornerSize);
      drawCorner(pageWidth - margin - 4 - cornerSize, pageHeight - margin - 4 - cornerSize);

      let currentY = margin + 10;

      // 2. Auspicious Invocation Header
      doc.font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(gold)
        .text("|| SHREE GANESHAYA NAMAH ||", margin, currentY, {
          width: contentWidth,
          align: "center",
        });

      currentY += 14;

      // 3. Header Branding Banner
      const bannerHeight = 44;
      doc.save();
      doc.rect(margin + 6, currentY, contentWidth - 12, bannerHeight)
        .fillColor(maroon)
        .fill();
      doc.restore();

      doc.font("Helvetica-Bold")
        .fontSize(16)
        .fillColor("#ffffff")
        .text("NAR NAARI VIVAH SEWA", margin + 6, currentY + 6, {
          width: contentWidth - 12,
          align: "center",
        });

      doc.font("Helvetica")
        .fontSize(8.5)
        .fillColor("#fef08a")
        .text("RISHTECLUB MATRIMONY  *  VERIFIED MATRIMONIAL PORTAL  *  WWW.RISHTECLUB.COM", margin + 6, currentY + 26, {
          width: contentWidth - 12,
          align: "center",
        });

      currentY += bannerHeight + 6;

      // 4. Profile Reference Strip
      const refStripHeight = 18;
      doc.save();
      doc.rect(margin + 6, currentY, contentWidth - 12, refStripHeight)
        .fillColor(lightBg)
        .strokeColor(borderGold)
        .lineWidth(0.8)
        .fillAndStroke();
      doc.restore();

      const profileCode = profile.legacyProfileId || profile.profileId || "-";
      const systemId = profile.profileId !== profile.legacyProfileId ? ` (ID: ${profile.profileId})` : "";

      doc.font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(maroon)
        .text(`PROFILE REF: ${profileCode}${systemId}`, margin + 14, currentY + 4, {
          width: 320,
        });

      doc.font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(gold)
        .text("100% VERIFIED BIODATA", pageWidth - margin - 180, currentY + 4, {
          width: 165,
          align: "right",
        });

      currentY += refStripHeight + 8;

      // Helper function to draw Section Header
      const drawSectionHeader = (title: string, yPos: number): number => {
        doc.save();
        doc.rect(margin + 6, yPos, contentWidth - 12, 18)
          .fillColor(sectionHeaderBg)
          .fill();
        doc.restore();

        doc.font("Helvetica-Bold")
          .fontSize(9.5)
          .fillColor("#ffffff")
          .text(title.toUpperCase(), margin + 14, yPos + 4, {
            width: contentWidth - 28,
          });

        return yPos + 22;
      };

      // Helper function to draw field row (Label : Value)
      const drawField = (
        label: string,
        val: string | null | undefined,
        x: number,
        y: number,
        w: number,
        labelWidth: number = 100
      ) => {
        const displayVal = val && String(val).trim() !== "" ? String(val).trim() : "-";
        doc.font("Helvetica-Bold")
          .fontSize(8.5)
          .fillColor(darkText)
          .text(label, x, y, { width: labelWidth });

        doc.font("Helvetica-Bold")
          .fontSize(8.5)
          .fillColor(mutedText)
          .text(":", x + labelWidth, y, { width: 10 });

        doc.font("Helvetica")
          .fontSize(8.5)
          .fillColor(darkText)
          .text(displayVal, x + labelWidth + 8, y, { width: w - labelWidth - 8, lineBreak: false });
      };

      // 5. Hero & Overview Section (with Photo on Right)
      const photoWidth = 105;
      const photoHeight = 125;
      const photoX = pageWidth - margin - 12 - photoWidth;
      const photoY = currentY;

      // Draw Photo Box on Right
      doc.save();
      doc.rect(photoX, photoY, photoWidth, photoHeight)
        .fillColor("#f8fafc")
        .strokeColor(borderGold)
        .lineWidth(1.2)
        .fillAndStroke();

      if (photoBuffer) {
        try {
          doc.image(photoBuffer, photoX + 2, photoY + 2, {
            fit: [photoWidth - 4, photoHeight - 4],
            align: "center",
            valign: "center",
          });
        } catch {
          // If image decoding fails, show fallback text
          doc.font("Helvetica").fontSize(8).fillColor(mutedText).text("Candidate Photo", photoX, photoY + 55, {
            width: photoWidth,
            align: "center",
          });
        }
      } else {
        doc.font("Helvetica").fontSize(8.5).fillColor(mutedText).text("[ Photo Not Available ]", photoX + 5, photoY + 55, {
          width: photoWidth - 10,
          align: "center",
        });
      }
      doc.restore();

      // Left Column for Personal Overview
      const fullName =
        profile.user?.fullName ||
        [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
        "Candidate";
      const gender = profile.user?.gender ? (profile.user.gender === "MALE" ? "Male (Groom)" : "Female (Bride)") : "-";
      const age = calculateAge(profile.dateOfBirth);
      const dobStr = formatDOB(profile.dateOfBirth);
      const ageDob = age ? `${dobStr} (${age} Yrs)` : dobStr;

      doc.font("Helvetica-Bold")
        .fontSize(15)
        .fillColor(maroon)
        .text(fullName.toUpperCase(), margin + 10, currentY + 2, {
          width: photoX - margin - 20,
        });

      let subY = currentY + 22;
      const leftColWidth = photoX - margin - 16;

      drawField("Gender", gender, margin + 10, subY, leftColWidth, 85);
      subY += 15;
      drawField("Date of Birth", ageDob, margin + 10, subY, leftColWidth, 85);
      subY += 15;
      drawField("Height", profile.height || "-", margin + 10, subY, leftColWidth, 85);
      subY += 15;
      drawField("Marital Status", profile.maritalStatus || "Never Married", margin + 10, subY, leftColWidth, 85);
      subY += 15;
      drawField("Religion / Caste", [profile.religion, profile.caste].filter(Boolean).join(" / ") || "-", margin + 10, subY, leftColWidth, 85);
      subY += 15;
      drawField("Mother Tongue", profile.motherTongue || "Hindi", margin + 10, subY, leftColWidth, 85);

      currentY = photoY + photoHeight + 8;

      // 6. Astrological & Birth Details
      currentY = drawSectionHeader("1. Astrological & Birth Details", currentY);
      const halfCol = (contentWidth - 28) / 2;

      drawField("Birth Time", profile.birthTime || "-", margin + 10, currentY, halfCol, 85);
      drawField("Birth Place", profile.birthPlace || "-", margin + 10 + halfCol + 8, currentY, halfCol, 85);
      currentY += 15;

      drawField("Manglik Status", profile.manglik || "Non-Manglik", margin + 10, currentY, halfCol, 85);
      drawField("Diet / Food", profile.diet || "Vegetarian", margin + 10 + halfCol + 8, currentY, halfCol, 85);
      currentY += 20;

      // 7. Education & Professional Details
      currentY = drawSectionHeader("2. Education & Career Background", currentY);
      drawField("Qualification", profile.education?.highestQualification || "-", margin + 10, currentY, contentWidth - 28, 95);
      currentY += 15;

      if (profile.education?.college) {
        drawField("College / Univ", profile.education.college, margin + 10, currentY, contentWidth - 28, 95);
        currentY += 15;
      }

      drawField("Profession / Job", profile.occupation?.profession || "-", margin + 10, currentY, halfCol, 95);
      drawField("Organization", profile.occupation?.company || "-", margin + 10 + halfCol + 8, currentY, halfCol, 85);
      currentY += 15;

      drawField("Annual Income", profile.occupation?.annualIncome || "Disclosed on Interest", margin + 10, currentY, halfCol, 95);
      drawField("Work Location", profile.education?.occupationField || "-", margin + 10 + halfCol + 8, currentY, halfCol, 85);
      currentY += 20;

      // 8. Family Background
      currentY = drawSectionHeader("3. Family Details & Residence", currentY);
      const fatherStr = profile.family?.fatherName
        ? `${profile.family.fatherName}${profile.family.fatherOccupation ? ` (${profile.family.fatherOccupation})` : ""}`
        : "-";
      const motherStr = profile.family?.motherName
        ? `${profile.family.motherName}${profile.family.motherOccupation ? ` (${profile.family.motherOccupation})` : ""}`
        : "-";

      drawField("Father's Name", fatherStr, margin + 10, currentY, contentWidth - 28, 95);
      currentY += 15;
      drawField("Mother's Name", motherStr, margin + 10, currentY, contentWidth - 28, 95);
      currentY += 15;

      const siblings = [
        profile.family?.brothers !== undefined && profile.family?.brothers !== null
          ? `${profile.family.brothers} Brother(s)`
          : null,
        profile.family?.sisters !== undefined && profile.family?.sisters !== null
          ? `${profile.family.sisters} Sister(s)`
          : null,
      ]
        .filter(Boolean)
        .join(", ");

      drawField("Siblings", siblings || profile.family?.siblingsDetails || "-", margin + 10, currentY, halfCol, 95);
      drawField(
        "Family Type",
        [profile.family?.familyType, profile.family?.familyStatus].filter(Boolean).join(" / ") || "Nuclear / Middle Class",
        margin + 10 + halfCol + 8,
        currentY,
        halfCol,
        85
      );
      currentY += 15;

      if (profile.family?.propertyDetails) {
        drawField("Residence / Property", profile.family.propertyDetails, margin + 10, currentY, contentWidth - 28, 95);
        currentY += 15;
      }
      currentY += 5;

      // 9. Contact Details (For Direct Family Communication & Group Sharing)
      currentY = drawSectionHeader("4. Contact Details (For Match Discussion)", currentY);

      // Extract all phone numbers
      const allPhones: string[] = [];
      if (profile.user?.mobile) allPhones.push(profile.user.mobile);
      if (profile.phoneNumbers && profile.phoneNumbers.length > 0) {
        for (const p of profile.phoneNumbers) {
          if (p.phone && !allPhones.includes(p.phone)) allPhones.push(p.phone);
        }
      }
      const phoneText = allPhones.length > 0 ? allPhones.join(" / ") : "-";

      drawField("Contact Person", profile.contactPerson || "Family / Self", margin + 10, currentY, halfCol, 95);
      drawField("Mobile Number", phoneText, margin + 10 + halfCol + 8, currentY, halfCol, 85);
      currentY += 15;

      if (profile.user?.email) {
        drawField("Email ID", profile.user.email, margin + 10, currentY, contentWidth - 28, 95);
        currentY += 15;
      }
      currentY += 5;

      // 10. Partner Preferences (if any)
      if (profile.partnerPreference) {
        currentY = drawSectionHeader("5. Partner Expectations", currentY);
        const prefAge =
          profile.partnerPreference.minAge || profile.partnerPreference.maxAge
            ? `${profile.partnerPreference.minAge || "Any"} to ${profile.partnerPreference.maxAge || "Any"} Yrs`
            : "Suitable Match";
        const prefHeight =
          profile.partnerPreference.minHeight || profile.partnerPreference.maxHeight
            ? `${profile.partnerPreference.minHeight || "Any"} - ${profile.partnerPreference.maxHeight || "Any"}`
            : "Suitable Match";

        drawField("Preferred Age", prefAge, margin + 10, currentY, halfCol, 95);
        drawField("Preferred Height", prefHeight, margin + 10 + halfCol + 8, currentY, halfCol, 85);
        currentY += 15;

        drawField(
          "Preferred Community",
          [profile.partnerPreference.preferredReligion, profile.partnerPreference.preferredCaste].filter(Boolean).join(" / ") || "Open to all",
          margin + 10,
          currentY,
          contentWidth - 28,
          95
        );
        currentY += 18;
      }

      // 11. Optional Special Notes
      if (profile.notes || profile.otherMatrimonyInfo) {
        const noteText = [profile.notes, profile.otherMatrimonyInfo].filter(Boolean).join(" | ");
        if (noteText.length > 0 && currentY < pageHeight - 95) {
          drawField("Additional Info", noteText.slice(0, 180), margin + 10, currentY, contentWidth - 28, 95);
          currentY += 16;
        }
      }

      // 12. Bottom Promotional & Branding Footer Banner
      const footerY = pageHeight - margin - 52;
      doc.save();
      doc.rect(margin + 6, footerY, contentWidth - 12, 46)
        .fillColor(maroon)
        .fill();
      doc.restore();

      doc.font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor("#ffffff")
        .text("Find More 100% Verified Matches on:  www.rishteclub.com", margin + 6, footerY + 6, {
          width: contentWidth - 12,
          align: "center",
        });

      doc.font("Helvetica-Bold")
        .fontSize(8.5)
        .fillColor("#fef08a")
        .text(
          "WhatsApp Only (No Calls): +91 9871592002  *  Nar Naari Vivah Sewa  *  Free Registration",
          margin + 6,
          footerY + 20,
          {
            width: contentWidth - 12,
            align: "center",
          }
        );

      doc.font("Helvetica-Oblique")
        .fontSize(7)
        .fillColor("#f1f5f9")
        .text(
          "Downloaded from RishteClub. Share this verified biodata freely in matrimonial groups and family circles.",
          margin + 6,
          footerY + 33,
          {
            width: contentWidth - 12,
            align: "center",
          }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Returns structured directory components:
 * [BASE_DIR]/[Gender]/[MaritalStatus]/[Caste]/[ProfileId].pdf
 */
export function getBiodataStructuredPath(profile: BiodataProfileInput): {
  genderFolder: string;
  maritalStatusFolder: string;
  casteFolder: string;
  fileName: string;
  relativeDir: string;
} {
  const legacy = String(profile.legacyProfileId || "").toUpperCase().trim();
  let isFemale = false;

  if (legacy.includes("-G-") || legacy.startsWith("NNVS-G") || legacy.startsWith("G-") || legacy.startsWith("G0")) {
    isFemale = true;
  } else if (legacy.includes("-B-") || legacy.startsWith("NNVS-B") || legacy.startsWith("B-") || legacy.startsWith("B0")) {
    isFemale = false;
  } else {
    const gender = String(profile.user?.gender || "MALE").toUpperCase().trim();
    isFemale = gender === "FEMALE";
  }

  const genderFolder = isFemale ? "Female" : "Male";

  const ms = String(profile.maritalStatus || "").trim().toLowerCase();
  let maritalStatusFolder = "Never Married";
  if (ms.includes("divorc")) {
    maritalStatusFolder = "Divorced";
  } else if (ms.includes("widow")) {
    maritalStatusFolder = isFemale ? "Widow" : "Widower";
  } else if (ms.includes("annul")) {
    maritalStatusFolder = "Annulled";
  } else if (ms.includes("separat")) {
    maritalStatusFolder = "Separated";
  }

  const rawCaste = String(profile.caste || "").trim();
  const casteFolder = (rawCaste && rawCaste !== "null" && rawCaste !== "undefined" ? rawCaste : "General")
    .replace(/[<>:"/\\|?*]/g, "_")
    .trim();

  const code = (profile.profileId || profile.legacyProfileId || profile.id || "candidate")
    .replace(/[<>:"/\\|?*]/g, "_");
  const fileName = `${code}.pdf`;

  const relativeDir = path.join(genderFolder, maritalStatusFolder, casteFolder);

  return { genderFolder, maritalStatusFolder, casteFolder, fileName, relativeDir };
}

/**
 * Saves a copy of the generated PDF automatically to:
 * [BASE_DIR]/[Gender]/[MaritalStatus]/[Caste]/[ProfileId].pdf
 * Base folder is configurable via process.env.PDF_STORAGE_DIR (default: ./storage/biodatas/)
 */
export async function saveBiodataPdfLocally(
  profile: BiodataProfileInput,
  pdfBuffer: Buffer
): Promise<{ success: boolean; filePath: string; relativePath: string; error?: string }> {
  try {
    const baseDir =
      process.env.PDF_STORAGE_DIR && process.env.PDF_STORAGE_DIR.trim()
        ? process.env.PDF_STORAGE_DIR.trim()
        : path.join(process.cwd(), "storage", "biodatas");

    const { relativeDir, fileName } = getBiodataStructuredPath(profile);
    const targetDir = path.join(baseDir, relativeDir);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const fullPath = path.join(targetDir, fileName);
    fs.writeFileSync(fullPath, pdfBuffer);

    return {
      success: true,
      filePath: fullPath,
      relativePath: path.join(relativeDir, fileName),
    };
  } catch (err: any) {
    console.error("saveBiodataPdfLocally error:", err);
    return {
      success: false,
      filePath: "",
      relativePath: "",
      error: err?.message || String(err),
    };
  }
}

/**
 * Auto-generates and saves/replaces the biodata PDF for a given profile ID
 */
export async function autoGenerateAndSaveBiodataPdf(profileId: string): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const profile = await prisma.profile.findFirst({
      where: {
        OR: [{ id: profileId }, { profileId }],
      },
      include: {
        user: true,
        photos: {
          orderBy: { isPrimary: "desc" },
        },
        family: true,
        education: true,
        occupation: true,
        partnerPreference: true,
        phoneNumbers: true,
      },
    });

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    const pdfBuffer = await generateBiodataPdfBuffer(profile as any);
    const result = await saveBiodataPdfLocally(profile as any, pdfBuffer);
    return result;
  } catch (err: any) {
    console.error(`autoGenerateAndSaveBiodataPdf failed for ${profileId}:`, err);
    return { success: false, error: err?.message || String(err) };
  }
}

