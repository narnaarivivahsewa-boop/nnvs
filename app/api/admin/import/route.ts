console.log("🚀 NEW IMPORT ROUTE LOADED");
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
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

    const sheetName =
      workbook.SheetNames[0];

    const worksheet =
      workbook.Sheets[sheetName];

    const rows: any[] =
      XLSX.utils.sheet_to_json(
        worksheet,
        {
          defval: "",
        }
      );

    console.log(
      "TOTAL ROWS:",
      rows.length
    );

    if (rows.length > 0) {
      console.log(
        "FIRST ROW:",
        rows[0]
      );
    }

    // =====================================
    // Counters
    // =====================================

    let imported = 0;

    let skipped = 0;

    const skippedRows: string[] = [];

    // =====================================
    // Import Loop
    // =====================================

    for (const row of rows) {

      const profileId = String(
        row["Profile ID"] || ""
      ).trim();

      const fullName = String(
        row["Name"] || ""
      ).trim();

      const mobile = String(
  row["Contact No. "] || ""
)
  .replace(/\.0$/, "")
  .replace(/\D/g, "")
  .trim();
        console.log("PROFILE:", profileId);
console.log("MOBILE:", mobile);

      if (!profileId || !mobile) {
        skipped++;
        skippedRows.push(
          profileId ||
            mobile ||
            "Invalid Row"
        );
        continue;
      }

      console.log(
        "IMPORTING:",
        profileId,
        mobile
      );

      // =====================================
      // Duplicate Profile
      // =====================================

      const existingProfile =
  await prisma.profile.findUnique({
    where: {
      profileId,
    },
  });
  console.log("existingProfile:", existingProfile);

console.log(
  profileId,
  "existingProfile =",
  existingProfile
);

if (existingProfile) {
  console.log("PROFILE EXISTS");
  skipped++;
  skippedRows.push(profileId);
  continue;
}

// =====================================
// Duplicate User
// =====================================

const existingUser =
  await prisma.user.findUnique({
    where: {
      mobile,
    },
  });
  console.log("existingUser:", existingUser);

console.log(
  mobile,
  "existingUser =",
  existingUser
);

if (existingUser) {
  console.log("USER EXISTS");
  skipped++;
  skippedRows.push(mobile);
  continue;
}

      // =====================================
      // Transaction Starts
      // =====================================

      try {

  await prisma.$transaction(async (tx) => {
                   
          const user = await tx.user.create({
            data: {
              fullName,

              mobile,

              email: null,

              password: null,

              gender:
                String(row["Gender"])
                  .toLowerCase()
                  .trim() === "female"
                  ? "FEMALE"
                  : "MALE",

              role: "MEMBER",

              status: "ACTIVE",

              mobileVerified: true,

              emailVerified: false,
              createdAt: parseExcelDate(row["Timestamp"]) || new Date(),
            },
          });

          // =====================================
          // Create Profile
          // =====================================

          const profile =
            await tx.profile.create({
              data: {
                userId: user.id,

                profileId,

                firstName:
                  fullName.split(" ")[0] ||
                  fullName,

                lastName:
                  fullName
                    .split(" ")
                    .slice(1)
                    .join(" ") || null,

                dateOfBirth:
                  parseExcelDate(
                    row["Date of Birth"]
                  ),

                height: convertHeight(
                  String(
                    row["Height"] || ""
                  )
                ),

                maritalStatus:
                  row["Marital Status"] ||
                  null,

                religion: null,

                caste:
                  extractCaste(fullName),

                motherTongue: null,

                isVisible: true,

                paymentCompleted: true,

                approvalStatus:
                  "APPROVED",
              },
            });

          // =====================================
          // Family
          // =====================================

          await tx.family.create({
            data: {
              profileId: profile.id,

              fatherName:
                row["Father's Name"] ||
                null,

              motherName:
                row["Mother's Name"] ||
                null,

              brothers:
                extractBrothers(
                  String(
                    row[
                      "Siblings Details"
                    ] || ""
                  )
                ),

              sisters:
                extractSisters(
                  String(
                    row[
                      "Siblings Details"
                    ] || ""
                  )
                ),

              familyType:
  row["Family Type"] != null
    ? String(row["Family Type"])
    : null,

familyStatus:
  row["House Status"] != null
    ? String(row["House Status"])
    : null,
            },
          });

          // =====================================
          // Education
          // =====================================

          await tx.education.create({
            data: {
              profileId: profile.id,

              highestQualification:
  row["Qualification"]
    ? String(row["Qualification"])
    : null,

              college: null,

              occupationField:
  row["Occupation"] != null
    ? String(row["Occupation"])
    : null,
            },
          });

          // =====================================
          // Occupation
          // =====================================

          await tx.occupation.create({
            data: {
              profileId: profile.id,

              profession:
  row["Occupation"] != null
    ? String(row["Occupation"])
    : null,

              company: null,

              annualIncome: String(
                row["Income (self)"] ||
                  ""
              ),
            },
          });

          // =====================================
          // Partner Preference
          // =====================================

          await tx.partnerPreference.create({
            data: {
              profileId: profile.id,

              preferredReligion:
                null,

              preferredCaste: null,
            },
          });

          imported++;

});

} catch (err) {

  console.error(
    "FAILED PROFILE:",
    profileId,
    err
  );

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

  } catch (error: any) {

    console.error("IMPORT ERROR =>", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Import failed.",
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
): number | null {

  if (!height) return null;

  const match = height.match(
    /(\d+)\D+(\d+)/
  );

  if (!match) return null;

  const feet = Number(match[1]);

  const inches = Number(match[2]);

  return Math.round(
    (feet * 12 + inches) * 2.54
  );
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