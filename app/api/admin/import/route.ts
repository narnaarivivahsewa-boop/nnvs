import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    // =====================================
    // Read Uploaded File
    // =====================================

    const formData = await req.formData();

    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "Excel file is required.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================
    // Read Workbook
    // =====================================

    const buffer = Buffer.from(
      await file.arrayBuffer()
    );

    const workbook = XLSX.read(buffer, {
      type: "buffer",
    });

    const sheetName = workbook.SheetNames[0];
    const worksheet = sheetName ? workbook.Sheets[sheetName] : undefined;

    if (!worksheet) {
      return NextResponse.json(
        {
          success: false,
          message: "Uploaded Excel file contains no valid worksheet.",
        },
        { status: 400 }
      );
    }

    const rows: any[] = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
    });

    // =====================================
    // Counters & Pre-computed Hash
    // =====================================

    let imported = 0;
    let skipped = 0;
    const skippedRows: string[] = [];
    const initialPasswordHash = await bcrypt.hash("NNVS@RC2026", 10);

    // =====================================
    // Import Loop
    // =====================================

    for (const row of rows) {
      const profileId = String(row["Profile ID"] || "").trim();
      const fullName = String(row["Name"] || "").trim();
      const mobile = String(row["Contact No. "] || row["Contact No."] || "")
        .replace(/\.0$/, "")
        .replace(/\D/g, "")
        .trim();

      if (!profileId || !mobile) {
        skipped++;
        skippedRows.push(profileId || mobile || "Invalid Row");
        continue;
      }

      // =====================================
      // Duplicate Profile
      // =====================================

      const existingProfile = await prisma.profile.findUnique({
        where: { profileId },
        select: { id: true },
      });

      if (existingProfile) {
        skipped++;
        skippedRows.push(profileId);
        continue;
      }

      // =====================================
      // User Lookup or Nested Creation (Single Atomic Write)
      // =====================================

      const existingUser = await prisma.user.findUnique({
        where: { mobile },
        select: { id: true },
      });

      const nestedProfileData = {
        profileId,
        oldNnvsId: profileId,
        firstName: fullName.split(" ")[0] || fullName,
        lastName: fullName.split(" ").slice(1).join(" ") || null,
        dateOfBirth: parseExcelDate(row["Date of Birth"]),
        height: convertHeight(String(row["Height"] || "")),
        maritalStatus: row["Marital Status"] ? String(row["Marital Status"]) : null,
        religion: null,
        caste: extractCaste(fullName),
        motherTongue: null,
        isVisible: false,
        paymentCompleted: true,
        isPaymentExempted: true,
        paymentExemptionReason: "Excel Admin Import",
        approvalStatus: "PENDING_APPROVAL" as const,
        family: {
          create: {
            fatherName: row["Father's Name"] ? String(row["Father's Name"]) : null,
            motherName: row["Mother's Name"] ? String(row["Mother's Name"]) : null,
            brothers: extractBrothers(String(row["Siblings Details"] || "")),
            sisters: extractSisters(String(row["Siblings Details"] || "")),
            familyType: row["Family Type"] != null ? String(row["Family Type"]) : null,
            familyStatus: row["House Status"] != null ? String(row["House Status"]) : null,
          },
        },
        education: {
          create: {
            highestQualification: row["Qualification"] ? String(row["Qualification"]) : null,
            college: null,
            occupationField: row["Occupation"] != null ? String(row["Occupation"]) : null,
          },
        },
        occupation: {
          create: {
            profession: row["Occupation"] != null ? String(row["Occupation"]) : null,
            company: null,
            annualIncome: String(row["Income (self)"] || ""),
          },
        },
        partnerPreference: {
          create: {
            preferredReligion: null,
            preferredCaste: null,
          },
        },
      };

      try {
        if (existingUser) {
          await prisma.profile.create({
            data: {
              ...nestedProfileData,
              userId: existingUser.id,
            },
            select: { id: true },
          });
        } else {
          await prisma.user.create({
            data: {
              fullName,
              mobile,
              email: null,
              password: initialPasswordHash,
              mustChangePassword: true,
              gender:
                String(row["Gender"]).toLowerCase().trim() === "female"
                  ? "FEMALE"
                  : "MALE",
              role: "MEMBER",
              status: "ACTIVE",
              mobileVerified: true,
              emailVerified: false,
              createdAt: parseExcelDate(row["Timestamp"]) || new Date(),
              profiles: {
                create: nestedProfileData,
              },
            },
            select: { id: true },
          });
        }

        imported++;
      } catch (err) {
        console.error("FAILED PROFILE IMPORT:", profileId, err);
        skipped++;
        skippedRows.push(profileId);
      }
    } // for loop end

    // =====================================
    // Response
    // =====================================

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      skippedRows,
      total: rows.length,
    });
  } catch (error) {
    console.error("IMPORT ERROR =>", error);

    return NextResponse.json(
      {
        success: false,
        message: "Import failed. Please verify the Excel file format and try again.",
      },
      {
        status: 500,
      }
    );
  }
}

// =======================================
// Helper Functions
// =======================================

function parseExcelDate(value: any): Date | null {

  if (!value) return null;

  if (typeof value === "number") {

    const excelEpoch = new Date(Date.UTC(1899, 11, 30));

    return new Date(
      excelEpoch.getTime() + value * 24 * 60 * 60 * 1000
    );

  }

  
  const date = new Date(value);

  return isNaN(date.getTime())
    ? null
    : date;
}

function convertHeight(
  height: string
): string | null {

  if (!height) return null;

  const value = height.trim();

  // Already in feet/inches format:
  // 5'6", 6'0", 5'10"
  const feetInchesMatch = value.match(
    /^(\d+)\s*['â€™]\s*(\d+)\s*["â€]?$/
  );

  if (feetInchesMatch) {
    const feet = Number(feetInchesMatch[1]);
    const inches = Number(feetInchesMatch[2]);

    return `${feet}'${inches}"`;
  }

  // Formats such as:
  // 5 feet 6 inches
  // 5 ft 6 in
  const wordsMatch = value.match(
    /^(\d+)\s*(?:feet|foot|ft)\s*(\d+)\s*(?:inches|inch|in)?$/i
  );

  if (wordsMatch) {
    const feet = Number(wordsMatch[1]);
    const inches = Number(wordsMatch[2]);

    return `${feet}'${inches}"`;
  }

  // Formats such as:
  // 5 feet
  // 6 ft
  const feetOnlyMatch = value.match(
    /^(\d+)\s*(?:feet|foot|ft)$/i
  );

  if (feetOnlyMatch) {
    return `${Number(feetOnlyMatch[1])}'0"`;
  }

  return value;
}
function extractBrothers(
  value: string
): number {

  const match = value.match(
    /(\d+)\s*Brother/i
  );

  return match
    ? Number(match[1])
    : 0;
}

function extractSisters(
  value: string
): number {

  const match = value.match(
    /(\d+)\s*Sister/i
  );

  return match
    ? Number(match[1])
    : 0;
}

function extractCaste(
  fullName: string
): string | null {

  if (!fullName) return null;

  const parts = fullName
    .trim()
    .split(" ");

  if (parts.length < 2)
    return null;

  return parts[parts.length - 1];
}




