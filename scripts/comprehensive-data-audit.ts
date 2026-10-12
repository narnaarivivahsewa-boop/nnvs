import * as XLSX from "xlsx";
import { prisma } from "../lib/prisma";
import fs from "fs";

interface AuditDiscrepancy {
  profileId: string;
  legacyProfileId: string | null;
  name: string;
  field: string;
  sourceValue: string | null;
  dbValue: string | null;
  pdfValue: string | null;
  recommendedCorrection: string;
  confidence: "CONFIRMED" | "HIGH" | "AMBIGUOUS" | "MANUAL_REVIEW";
  reason: string;
}

async function runAudit() {
  console.log("================================================================================");
  console.log("RISHTECLUB - FULL COMPREHENSIVE PIPELINE AUDIT (SHEETS -> DB -> PDF)");
  console.log("================================================================================");

  // 1. Load Excel
  const wb = XLSX.readFile("NNVS (Responses).xlsx");
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Map Excel by row number and by Legacy ID
  const excelByRow = new Map<number, any>();
  const excelByLegId = new Map<string, any>();
  const excelByMobile = new Map<string, any[]>();

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0 || row.every((c) => c === undefined || c === null || String(c).trim() === "")) continue;
    const rowNum = i + 1;
    const legId = row[0] ? String(row[0]).trim().toUpperCase() : "";
    const mobile = row[25] ? String(row[25]).replace(/\D/g, "").slice(-10) : "";

    const entry = { rowNum, row };
    excelByRow.set(rowNum, entry);
    if (legId) {
      if (!excelByLegId.has(legId)) excelByLegId.set(legId, entry);
    }
    if (mobile) {
      if (!excelByMobile.has(mobile)) excelByMobile.set(mobile, []);
      excelByMobile.get(mobile)!.push(entry);
    }
  }

  // 2. Load G-series parsed JSON if available
  let gSeriesList: any[] = [];
  if (fs.existsSync("scripts/g-series-parsed.json")) {
    try {
      gSeriesList = JSON.parse(fs.readFileSync("scripts/g-series-parsed.json", "utf8"));
    } catch (e) {}
  }
  const gSeriesById = new Map<string, any>();
  for (const g of gSeriesList) {
    if (g.profileId) gSeriesById.set(g.profileId.toUpperCase().trim(), g);
  }

  // 3. Fetch all 630 Profiles from Database with relations
  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      user: true,
      family: true,
      education: true,
      occupation: true,
      partnerPreference: true,
      phoneNumbers: true,
    },
  });

  console.log(`Loaded ${excelByRow.size} valid rows from Excel.`);
  console.log(`Loaded ${gSeriesById.size} profiles from G-Series JSON.`);
  console.log(`Auditing all ${profiles.length} database profiles...\n`);

  const discrepancies: AuditDiscrepancy[] = [];

  // Helper date formatter: DD MMM YYYY in UTC
  function formatDOBUtc(dob: Date | string | null | undefined): string {
    if (!dob) return "-";
    const d = new Date(dob);
    if (isNaN(d.getTime())) return String(dob);
    const day = String(d.getUTCDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    return `${day} ${month} ${year}`;
  }

  // Helper date formatter: DD MMM YYYY in IST (local server/India time)
  function formatDOBIst(dob: Date | string | null | undefined): string {
    if (!dob) return "-";
    const d = new Date(dob);
    if (isNaN(d.getTime())) return String(dob);
    // Add 5 hours 30 mins to UTC
    const istMs = d.getTime() + (5.5 * 60 * 60 * 1000);
    const istDate = new Date(istMs);
    const day = String(istDate.getUTCDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[istDate.getUTCMonth()];
    const year = istDate.getUTCFullYear();
    return `${day} ${month} ${year}`;
  }

  // Helper date parse from Excel raw
  function parseExcelDobString(raw: any): { display: string; isoDate: string } | null {
    if (!raw) return null;
    if (typeof raw === "number") {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const d = new Date(excelEpoch.getTime() + raw * 86400000);
      return {
        display: formatDOBUtc(d),
        isoDate: d.toISOString().split("T")[0],
      };
    }
    const str = String(raw).trim();
    const dmy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
    if (dmy) {
      const d = new Date(Date.UTC(parseInt(dmy[3], 10), parseInt(dmy[2], 10) - 1, parseInt(dmy[1], 10)));
      return {
        display: formatDOBUtc(d),
        isoDate: d.toISOString().split("T")[0],
      };
    }
    return null;
  }

  for (const p of profiles) {
    const legId = (p.legacyProfileId || "").toUpperCase().trim();
    const fullName = p.user?.fullName || `${p.firstName} ${p.lastName || ""}`.trim();
    const userMobile = (p.user?.mobile || "").replace(/\D/g, "").slice(-10);

    // Locate source record
    let sourceRecord: any = null;
    let sourceOrigin = "UNKNOWN";

    if (legId && excelByLegId.has(legId)) {
      sourceRecord = excelByLegId.get(legId);
      sourceOrigin = "EXCEL_SHEET";
    } else if (p.sourceId) {
      const match = p.sourceId.match(/ROW_(\d+)/i);
      if (match && excelByRow.has(parseInt(match[1], 10))) {
        sourceRecord = excelByRow.get(parseInt(match[1], 10));
        sourceOrigin = "EXCEL_SHEET";
      }
    } else if (userMobile && excelByMobile.has(userMobile)) {
      const candidates = excelByMobile.get(userMobile)!;
      sourceRecord = candidates[0];
      sourceOrigin = "EXCEL_SHEET";
    }

    let gRecord = legId ? gSeriesById.get(legId) : null;

    // =========================================================================
    // 1. DATE OF BIRTH AUDIT
    // =========================================================================
    if (sourceRecord && sourceOrigin === "EXCEL_SHEET") {
      const rawExcelDob = sourceRecord.row[6];
      const parsedExcelDob = parseExcelDobString(rawExcelDob);

      if (parsedExcelDob && p.dateOfBirth) {
        // Current PDF output uses `formatDOB` in lib/pdf/biodata-generator.ts:
        // `d.getDate()`, `months[d.getMonth()]`, `d.getFullYear()`
        // When executed in UTC, getDate() returns UTC day!
        const pdfRenderedDob = formatDOBUtc(p.dateOfBirth);
        const correctSourceDob = parsedExcelDob.display;

        // If the date in DB was stored as e.g. 1990-03-03T18:30:00.000Z (which is 4 Mar 1990 00:00:00 IST),
        // UTC getDate() gives 3 Mar instead of 4 Mar!
        if (pdfRenderedDob !== correctSourceDob) {
          discrepancies.push({
            profileId: p.profileId,
            legacyProfileId: p.legacyProfileId,
            name: fullName,
            field: "Date of Birth",
            sourceValue: `${correctSourceDob} (Raw Excel: ${rawExcelDob})`,
            dbValue: p.dateOfBirth.toISOString(),
            pdfValue: pdfRenderedDob,
            recommendedCorrection: `Store as midnight UTC (${parsedExcelDob.isoDate}T00:00:00.000Z) or format with Asia/Kolkata timezone so PDF renders exactly ${correctSourceDob}`,
            confidence: "CONFIRMED",
            reason: `Timezone shift: Stored as 18:30 UTC of previous day causes PDF getDate() to display 1 day earlier (${pdfRenderedDob} instead of ${correctSourceDob}).`,
          });
        }
      }
    } else if (gRecord && gRecord.dateOfBirth && p.dateOfBirth) {
      // Check G-series DOB
      const gDobParsed = parseExcelDobString(gRecord.dateOfBirth);
      if (gDobParsed) {
        const pdfRenderedDob = formatDOBUtc(p.dateOfBirth);
        if (pdfRenderedDob !== gDobParsed.display) {
          discrepancies.push({
            profileId: p.profileId,
            legacyProfileId: p.legacyProfileId,
            name: fullName,
            field: "Date of Birth",
            sourceValue: `${gDobParsed.display} (G-Series: ${gRecord.dateOfBirth})`,
            dbValue: p.dateOfBirth.toISOString(),
            pdfValue: pdfRenderedDob,
            recommendedCorrection: `Normalize to ${gDobParsed.isoDate}T00:00:00.000Z to render ${gDobParsed.display}`,
            confidence: "CONFIRMED",
            reason: `Timezone shift: Causes PDF to display 1 day early.`,
          });
        }
      }
    }

    // =========================================================================
    // 2. WORK LOCATION vs DESIGNATION / OCCUPATION AUDIT
    // =========================================================================
    const dbProfession = p.occupation?.profession;
    const dbOccField = p.education?.occupationField;
    const dbCompany = p.occupation?.company;

    if (sourceRecord && sourceOrigin === "EXCEL_SHEET") {
      const excelOccupation = sourceRecord.row[11] ? String(sourceRecord.row[11]).trim() : "";
      const excelAddress = sourceRecord.row[13] ? String(sourceRecord.row[13]).trim() : "";

      // In current schema & import script:
      // tx.education.create({ occupationField: occupation })
      // and in biodata-generator.ts:
      // drawField("Work Location", profile.education?.occupationField)
      if (dbOccField && excelOccupation && dbOccField === excelOccupation) {
        discrepancies.push({
          profileId: p.profileId,
          legacyProfileId: p.legacyProfileId,
          name: fullName,
          field: "Work Location vs Designation",
          sourceValue: `Designation: "${excelOccupation}" | Address/Location: "${excelAddress}"`,
          dbValue: `education.occupationField = "${dbOccField}"`,
          pdfValue: `Work Location = "${dbOccField}" (Duplicated with Profession = "${dbProfession}")`,
          recommendedCorrection: `Extract genuine work city/location from Address ("${excelAddress.slice(0, 40)}...") for Work Location, and keep Designation exclusively under Profession.`,
          confidence: "CONFIRMED",
          reason: `Field mapping error: import script mapped Col L (Occupation) to education.occupationField, which PDF template renders as "Work Location".`,
        });
      }
    }

    // =========================================================================
    // 3. GENDER AUDIT
    // =========================================================================
    const currentGender = p.user?.gender;
    let expectedGender: string | null = null;
    let genderConfidence: "CONFIRMED" | "HIGH" | "AMBIGUOUS" = "CONFIRMED";
    let genderReason = "";

    if (sourceRecord && sourceOrigin === "EXCEL_SHEET") {
      const excelGenderStr = sourceRecord.row[4] ? String(sourceRecord.row[4]).trim() : "";
      if (excelGenderStr.toLowerCase().includes("female")) expectedGender = "FEMALE";
      else if (excelGenderStr.toLowerCase().includes("male")) expectedGender = "MALE";
      genderReason = `Source Google Sheet Col E explicitly states: "${excelGenderStr}"`;
    } else if (gRecord && gRecord.gender) {
      if (gRecord.gender.toLowerCase().includes("female")) expectedGender = "FEMALE";
      else if (gRecord.gender.toLowerCase().includes("male")) expectedGender = "MALE";
      genderReason = `Source G-Series record states: "${gRecord.gender}"`;
    }

    if (expectedGender && currentGender && currentGender !== expectedGender) {
      discrepancies.push({
        profileId: p.profileId,
        legacyProfileId: p.legacyProfileId,
        name: fullName,
        field: "Gender",
        sourceValue: expectedGender,
        dbValue: currentGender,
        pdfValue: currentGender === "MALE" ? "Male (Groom)" : "Female (Bride)",
        recommendedCorrection: `Update User gender to ${expectedGender}`,
        confidence: "CONFIRMED",
        reason: genderReason,
      });
    }

    // Also check prefix conflict:
    const prefixGender = legId.includes("-G-") || legId.startsWith("G-") || legId.startsWith("NNVS-G") || legId.startsWith("G0")
      ? "FEMALE"
      : legId.includes("-B-") || legId.startsWith("B-") || legId.startsWith("NNVS-B") || legId.startsWith("B0")
      ? "MALE"
      : null;

    if (prefixGender && currentGender && prefixGender !== currentGender) {
      discrepancies.push({
        profileId: p.profileId,
        legacyProfileId: p.legacyProfileId,
        name: fullName,
        field: "Gender vs Profile ID Prefix Conflict",
        sourceValue: `Prefix implies ${prefixGender}`,
        dbValue: currentGender,
        pdfValue: currentGender === "MALE" ? "Male (Groom)" : "Female (Bride)",
        recommendedCorrection: `Verify whether Profile ID prefix (${legId}) is wrong or candidate gender is ${currentGender}.`,
        confidence: "AMBIGUOUS",
        reason: `Profile ID prefix implies ${prefixGender} while database has ${currentGender}.`,
      });
    }

    // =========================================================================
    // 4. MARITAL STATUS AUDIT
    // =========================================================================
    if (sourceRecord && sourceOrigin === "EXCEL_SHEET") {
      const excelMs = sourceRecord.row[5] ? String(sourceRecord.row[5]).trim() : "";
      if (excelMs && p.maritalStatus && excelMs.toLowerCase() !== p.maritalStatus.toLowerCase()) {
        discrepancies.push({
          profileId: p.profileId,
          legacyProfileId: p.legacyProfileId,
          name: fullName,
          field: "Marital Status",
          sourceValue: excelMs,
          dbValue: p.maritalStatus,
          pdfValue: p.maritalStatus,
          recommendedCorrection: `Update marital status to "${excelMs}"`,
          confidence: "HIGH",
          reason: `Excel source specifies "${excelMs}" but DB has "${p.maritalStatus}"`,
        });
      }
    }

    // =========================================================================
    // 5. PDF CATEGORY FOLDER CLASSIFICATION AUDIT
    // =========================================================================
    // In lib/pdf/biodata-generator.ts lines 555-562:
    // It checks prefix first: if legacyProfileId has G -> isFemale=true.
    // If a profile had an ambiguous prefix, it could be categorized wrongly.
  }

  // Summary counts
  const dobCount = discrepancies.filter((d) => d.field === "Date of Birth").length;
  const locCount = discrepancies.filter((d) => d.field === "Work Location vs Designation").length;
  const genderCount = discrepancies.filter((d) => d.field.startsWith("Gender")).length;
  const msCount = discrepancies.filter((d) => d.field === "Marital Status").length;

  console.log("================================================================================");
  console.log("AUDIT FINDINGS SUMMARY");
  console.log("================================================================================");
  console.log(`Total Profiles Audited: ${profiles.length}`);
  console.log(`Total Discrepancies Found: ${discrepancies.length}`);
  console.log(`- Date of Birth Timezone Shift (1 Day Early): ${dobCount}`);
  console.log(`- Work Location Populated with Designation: ${locCount}`);
  console.log(`- Gender Mismatches / Prefix Conflicts: ${genderCount}`);
  console.log(`- Marital Status Discrepancies: ${msCount}`);

  // Write full audit results to JSON artifact
  fs.writeFileSync(
    "scripts/audit-pipeline-results.json",
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        totalProfiles: profiles.length,
        totalDiscrepancies: discrepancies.length,
        counts: { dob: dobCount, locationVsDesignation: locCount, gender: genderCount, maritalStatus: msCount },
        discrepancies,
      },
      null,
      2
    )
  );

  console.log(`\nFull detailed audit data saved to: scripts/audit-pipeline-results.json`);
}

runAudit().catch(console.error).finally(() => prisma.$disconnect());
