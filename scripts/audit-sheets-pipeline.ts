import * as XLSX from "xlsx";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("================================================================================");
  console.log("NNVS MATRIMONY - GOOGLE SHEETS & DATABASE PIPELINE AUDIT");
  console.log("================================================================================");

  // 1. Load Excel
  const wb = XLSX.readFile("NNVS (Responses).xlsx");
  console.log("Sheet names:", wb.SheetNames);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  console.log(`Total rows in Excel: ${rawRows.length}`);
  const header = rawRows[0] || [];
  console.log(`\nHeader columns (${header.length}):`);
  header.forEach((h, i) => console.log(`  Col ${i} (${String.fromCharCode(65 + (i < 26 ? i : 0))}${i >= 26 ? String.fromCharCode(65 + i - 26) : ""}): "${h}"`));

  // 2. Fetch all Profiles from DB with relations
  const dbProfiles = await prisma.profile.findMany({
    include: {
      user: true,
      family: true,
      education: true,
      occupation: true,
      partnerPreference: true,
      phoneNumbers: true,
      photos: true,
    },
  });
  console.log(`\nTotal Profiles in Database: ${dbProfiles.length}`);

  // Create lookups for DB profiles
  const byLegacyId = new Map<string, typeof dbProfiles[0]>();
  const byProfileId = new Map<string, typeof dbProfiles[0]>();
  const bySourceId = new Map<string, typeof dbProfiles[0]>();
  const byMobile = new Map<string, typeof dbProfiles[0][]>();

  for (const p of dbProfiles) {
    if (p.legacyProfileId) {
      byLegacyId.set(p.legacyProfileId.toUpperCase().trim(), p);
    }
    if (p.profileId) {
      byProfileId.set(p.profileId.trim(), p);
    }
    if (p.sourceId) {
      bySourceId.set(p.sourceId.trim(), p);
    }
    const m = p.user?.mobile;
    if (m) {
      const cleanM = m.replace(/_r\d+.*$/, "");
      if (!byMobile.has(cleanM)) byMobile.set(cleanM, []);
      byMobile.get(cleanM)!.push(p);
    }
  }

  // Helper date formatter
  function formatDOB(dob: Date | null | undefined): string {
    if (!dob) return "-";
    const d = new Date(dob);
    if (isNaN(d.getTime())) return "-";
    const day = String(d.getUTCDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    return `${day} ${month} ${year}`;
  }

  // 3. Scan & compare every Excel row
  let matchedCount = 0;
  let unmatchedCount = 0;

  const genderMismatches: any[] = [];
  const dobDiscrepancies: any[] = [];
  const locationDesignationIssues: any[] = [];
  const maritalStatusIssues: any[] = [];
  const nameIssues: any[] = [];
  const missingInDb: any[] = [];

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0 || row.every((c) => c === undefined || c === null || String(c).trim() === "")) {
      continue;
    }

    const rowNum = i + 1;
    const legId = row[0] ? String(row[0]).trim() : "";
    const name = row[3] ? String(row[3]).trim() : "";
    const excelGenderRaw = row[4] ? String(row[4]).trim() : "";
    const maritalStatusRaw = row[5] ? String(row[5]).trim() : "";
    const dobRaw = row[6];
    const qualificationRaw = row[10] ? String(row[10]).trim() : "";
    const occupationRaw = row[11] ? String(row[11]).trim() : "";
    const incomeRaw = row[12] ? String(row[12]).trim() : "";
    const addressRaw = row[13] ? String(row[13]).trim() : "";
    const mobileRaw = row[25] ? String(row[25]).trim() : "";

    // Match to DB
    let dbMatch: typeof dbProfiles[0] | undefined;
    if (legId && byLegacyId.has(legId.toUpperCase())) {
      dbMatch = byLegacyId.get(legId.toUpperCase());
    } else if (bySourceId.has(`LOCAL_EXCEL_ROW_${rowNum}`)) {
      dbMatch = bySourceId.get(`LOCAL_EXCEL_ROW_${rowNum}`);
    } else if (bySourceId.has(`SHEET_ROW_${rowNum}`)) {
      dbMatch = bySourceId.get(`SHEET_ROW_${rowNum}`);
    } else {
      // Try by mobile or name
      const cleanM = mobileRaw.replace(/\D/g, "").slice(-10);
      if (cleanM && byMobile.has(cleanM)) {
        const candidates = byMobile.get(cleanM)!;
        dbMatch = candidates.find((c) => c.firstName?.toLowerCase() === name.split(" ")[0]?.toLowerCase()) || candidates[0];
      }
    }

    if (!dbMatch) {
      unmatchedCount++;
      missingInDb.push({ rowNum, legId, name, mobileRaw });
      continue;
    }

    matchedCount++;

    // A. Check Gender
    const dbGender = dbMatch.user?.gender;
    const excelGenderNorm = excelGenderRaw.toUpperCase().includes("FEMALE") ? "FEMALE" : excelGenderRaw.toUpperCase().includes("MALE") ? "MALE" : "";
    const prefixGender = legId.toUpperCase().includes("-G-") || legId.toUpperCase().startsWith("G-") || legId.toUpperCase().startsWith("NNVS-G") || legId.toUpperCase().startsWith("G0")
      ? "FEMALE"
      : legId.toUpperCase().includes("-B-") || legId.toUpperCase().startsWith("B-") || legId.toUpperCase().startsWith("NNVS-B") || legId.toUpperCase().startsWith("B0")
      ? "MALE"
      : null;

    if (excelGenderNorm && dbGender && excelGenderNorm !== dbGender) {
      genderMismatches.push({
        rowNum,
        profileId: dbMatch.profileId,
        legacyProfileId: dbMatch.legacyProfileId,
        name: dbMatch.user?.fullName || name,
        excelRaw: excelGenderRaw,
        excelGenderNorm,
        prefixGender,
        dbGender,
      });
    }

    // B. Check DOB
    // Format raw Excel DOB
    let excelDobFormatted = "";
    if (dobRaw) {
      if (typeof dobRaw === "number") {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const d = new Date(excelEpoch.getTime() + dobRaw * 86400000);
        excelDobFormatted = formatDOB(d);
      } else {
        const str = String(dobRaw).trim();
        const dmy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
        if (dmy) {
          const d = new Date(Date.UTC(parseInt(dmy[3], 10), parseInt(dmy[2], 10) - 1, parseInt(dmy[1], 10)));
          excelDobFormatted = formatDOB(d);
        }
      }
    }
    const dbDobFormatted = formatDOB(dbMatch.dateOfBirth);
    if (excelDobFormatted && dbDobFormatted && excelDobFormatted !== dbDobFormatted) {
      dobDiscrepancies.push({
        rowNum,
        profileId: dbMatch.profileId,
        legacyProfileId: dbMatch.legacyProfileId,
        name: dbMatch.user?.fullName || name,
        excelRaw: dobRaw,
        excelDobFormatted,
        dbDobFormatted,
        rawDbDob: dbMatch.dateOfBirth?.toISOString(),
      });
    }

    // C. Check Work Location vs Designation
    const dbProfession = dbMatch.occupation?.profession;
    const dbOccupationField = dbMatch.education?.occupationField;
    const dbCompany = dbMatch.occupation?.company;

    // Check if dbOccupationField was filled with profession instead of location
    if (dbOccupationField && occupationRaw && dbOccupationField === occupationRaw) {
      locationDesignationIssues.push({
        rowNum,
        profileId: dbMatch.profileId,
        legacyProfileId: dbMatch.legacyProfileId,
        name: dbMatch.user?.fullName || name,
        excelOccupation: occupationRaw,
        excelAddress: addressRaw,
        dbProfession,
        dbOccupationField,
        pdfWorkLocation: dbOccupationField,
      });
    }

    // D. Marital Status
    if (maritalStatusRaw && dbMatch.maritalStatus && maritalStatusRaw.toLowerCase() !== dbMatch.maritalStatus.toLowerCase()) {
      maritalStatusIssues.push({
        rowNum,
        profileId: dbMatch.profileId,
        name: dbMatch.user?.fullName || name,
        excel: maritalStatusRaw,
        db: dbMatch.maritalStatus,
      });
    }
  }

  console.log(`\n--- AUDIT SUMMARY ---`);
  console.log(`Matched Excel rows in DB: ${matchedCount}`);
  console.log(`Unmatched Excel rows: ${unmatchedCount}`);
  console.log(`Gender Mismatches (Excel vs DB): ${genderMismatches.length}`);
  console.log(`DOB Discrepancies (Excel vs DB): ${dobDiscrepancies.length}`);
  console.log(`Work Location filled with Occupation Job Title: ${locationDesignationIssues.length}`);
  console.log(`Marital Status discrepancies: ${maritalStatusIssues.length}`);

  if (genderMismatches.length > 0) {
    console.log(`\n=== GENDER MISMATCH DETAILS (Top 20) ===`);
    genderMismatches.slice(0, 20).forEach((m) => {
      console.log(`Row ${m.rowNum} | ${m.legacyProfileId || m.profileId} | ${m.name} | Excel: "${m.excelRaw}" (${m.excelGenderNorm}) | Prefix: ${m.prefixGender} | DB: ${m.dbGender}`);
    });
  }

  if (dobDiscrepancies.length > 0) {
    console.log(`\n=== DOB DISCREPANCIES (Top 20) ===`);
    dobDiscrepancies.slice(0, 20).forEach((d) => {
      console.log(`Row ${d.rowNum} | ${d.legacyProfileId || d.profileId} | ${d.name} | Excel Raw: "${d.excelRaw}" -> ${d.excelDobFormatted} vs DB: ${d.dbDobFormatted} (${d.rawDbDob})`);
    });
  }

  if (locationDesignationIssues.length > 0) {
    console.log(`\n=== WORK LOCATION VS DESIGNATION SAMPLE (Top 10) ===`);
    locationDesignationIssues.slice(0, 10).forEach((l) => {
      console.log(`Row ${l.rowNum} | ${l.legacyProfileId || l.profileId} | ${l.name} | Excel Occ: "${l.excelOccupation}" | Excel Addr: "${l.excelAddress}" | DB OccField: "${l.dbOccupationField}"`);
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
