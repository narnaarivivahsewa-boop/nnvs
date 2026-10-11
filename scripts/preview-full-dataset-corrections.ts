import * as XLSX from "xlsx";
import { prisma } from "../lib/prisma";
import fs from "fs";

interface ProposedChange {
  profileId: string;
  legacyProfileId: string | null;
  candidateName: string;
  fieldName: string;
  currentValue: any;
  sourceValue: any;
  proposedValue: any;
  confidence: "CONFIRMED" | "HIGH" | "FLAGGED_FOR_REVIEW" | "AMBIGUOUS";
  actionType: "SAFE_CODE_FIX" | "DATA_NORMALIZATION" | "MANUAL_VERIFICATION_REQUIRED";
  reason: string;
}

interface ProfileAuditSummary {
  profileId: string;
  legacyProfileId: string | null;
  candidateName: string;
  sourceStatus: "MATCHED_EXCEL" | "MATCHED_G_SERIES" | "NO_RELIABLE_SOURCE_MATCH";
  sourceDetail?: string;
  changesCount: number;
  hasAmbiguity: boolean;
  changes: ProposedChange[];
}

function parseExcelTimeFraction(raw: any): string | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const num = Number(raw);
  if (!isNaN(num) && num >= 0 && num < 1) {
    const totalMinutes = Math.round(num * 24 * 60);
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
  }
  const str = String(raw).trim();
  const legacyMatch = str.match(/(?:1899|1900).*?(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (legacyMatch) {
    const h = parseInt(legacyMatch[1], 10);
    const m = parseInt(legacyMatch[2], 10);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
  }
  return null;
}

function parseExcelDateRaw(raw: any): { display: string; isoDate: string } | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (typeof raw === "number" || (!isNaN(Number(raw)) && !String(raw).includes("-") && !String(raw).includes("/"))) {
    const num = Number(raw);
    if (num > 1000 && num < 60000) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const d = new Date(excelEpoch.getTime() + num * 86400000);
      const day = String(d.getUTCDate()).padStart(2, "0");
      const month = months[d.getUTCMonth()];
      const year = d.getUTCFullYear();
      return {
        display: `${day} ${month} ${year}`,
        isoDate: d.toISOString().split("T")[0],
      };
    }
  }
  const str = String(raw).trim();
  const dmy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmy) {
    const day = String(parseInt(dmy[1], 10)).padStart(2, "0");
    const monthIdx = parseInt(dmy[2], 10) - 1;
    const year = dmy[3];
    if (monthIdx >= 0 && monthIdx <= 11) {
      return {
        display: `${day} ${months[monthIdx]} ${year}`,
        isoDate: `${year}-${String(monthIdx + 1).padStart(2, "0")}-${day}`,
      };
    }
  }
  return null;
}

function formatDbDateUtc(d?: Date | null): string {
  if (!d) return "-";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = months[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

function formatDbDateIst(d?: Date | null): string {
  if (!d) return "-";
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).formatToParts(d);
    const day = parts.find((p) => p.type === "day")?.value || "";
    const month = parts.find((p) => p.type === "month")?.value || "";
    const year = parts.find((p) => p.type === "year")?.value || "";
    return `${day} ${month} ${year}`;
  } catch {
    return formatDbDateUtc(d);
  }
}

async function main() {
  console.log("================================================================================");
  console.log("PHASE 1.5 — FULL DATASET CORRECTION PREVIEW (READ-ONLY)");
  console.log("================================================================================");

  // 1. Load Excel
  const wb = XLSX.readFile("NNVS (Responses).xlsx");
  const rawRows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  const excelByLegId = new Map<string, any[]>();
  const excelByMobile = new Map<string, any[]>();

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0 || row.every((c) => c === undefined || c === null || String(c).trim() === "")) continue;
    const legId = row[0] ? String(row[0]).trim().toUpperCase() : "";
    const mobile = row[25] ? String(row[25]).replace(/\D/g, "").slice(-10) : "";
    if (legId) excelByLegId.set(legId, row);
    if (mobile) {
      if (!excelByMobile.has(mobile)) excelByMobile.set(mobile, []);
      excelByMobile.get(mobile)!.push(row);
    }
  }

  // 2. Load G-Series parsed JSON
  let gSeriesList: any[] = [];
  if (fs.existsSync("scripts/g-series-parsed.json")) {
    try {
      gSeriesList = JSON.parse(fs.readFileSync("scripts/g-series-parsed.json", "utf8"));
    } catch {}
  }
  const gSeriesMap = new Map<string, any>();
  for (const g of gSeriesList) {
    if (g.profileId) gSeriesMap.set(g.profileId.trim().toUpperCase(), g);
  }

  // 3. Fetch all 630 Profiles from DB (READ-ONLY)
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

  console.log(`Unique Database Profiles Audited: ${profiles.length}`);
  console.log(`Google Sheet Source Rows Loaded: ${excelByLegId.size}`);
  console.log(`G-Series Backup Profiles Loaded: ${gSeriesMap.size}\n`);

  const allSummaries: ProfileAuditSummary[] = [];
  const allProposedChanges: ProposedChange[] = [];

  let matchedExcelCount = 0;
  let matchedGSeriesCount = 0;
  let noSourceMatchCount = 0;

  let dobShiftCount = 0;
  let birthTimeFixCount = 0;
  let workLocationDuplicateCount = 0;
  let genderConflictCount = 0;
  let maritalStatusMismatchCount = 0;

  for (const p of profiles) {
    const legId = (p.legacyProfileId || "").toUpperCase().trim();
    const candidateName = p.user?.fullName || `${p.firstName} ${p.lastName || ""}`.trim();
    const userMobile = (p.user?.mobile || "").replace(/\D/g, "").slice(-10);

    let sourceRow: any[] | null = null;
    let gRecord: any = null;
    let sourceStatus: "MATCHED_EXCEL" | "MATCHED_G_SERIES" | "NO_RELIABLE_SOURCE_MATCH" = "NO_RELIABLE_SOURCE_MATCH";
    let sourceDetail = "No reliable matching source found in Google Sheet responses or G-Series archive";

    if (legId && excelByLegId.has(legId)) {
      sourceRow = excelByLegId.get(legId)!;
      sourceStatus = "MATCHED_EXCEL";
      sourceDetail = `Matched Google Sheet by Legacy ID: ${legId}`;
      matchedExcelCount++;
    } else if (legId && gSeriesMap.has(legId)) {
      gRecord = gSeriesMap.get(legId);
      sourceStatus = "MATCHED_G_SERIES";
      sourceDetail = `Matched G-Series Archive by Legacy ID: ${legId}`;
      matchedGSeriesCount++;
    } else if (userMobile && excelByMobile.has(userMobile)) {
      const candidates = excelByMobile.get(userMobile)!;
      sourceRow = candidates[0];
      sourceStatus = "MATCHED_EXCEL";
      sourceDetail = `Matched Google Sheet by Mobile Number (${userMobile})`;
      matchedExcelCount++;
    } else {
      noSourceMatchCount++;
    }

    const changes: ProposedChange[] = [];

    // =========================================================================
    // FIELD 1: Date of Birth
    // =========================================================================
    if (sourceRow) {
      const parsedExcelDob = parseExcelDateRaw(sourceRow[6]);
      if (parsedExcelDob && p.dateOfBirth) {
        const currentPdfDisplay = formatDbDateUtc(p.dateOfBirth);
        const correctedPdfDisplay = formatDbDateIst(p.dateOfBirth);
        const sourceCalendarDate = parsedExcelDob.display;

        if (currentPdfDisplay !== sourceCalendarDate) {
          dobShiftCount++;
          changes.push({
            profileId: p.profileId,
            legacyProfileId: p.legacyProfileId,
            candidateName,
            fieldName: "Date of Birth (dateOfBirth)",
            currentValue: `${currentPdfDisplay} (Stored UTC: ${p.dateOfBirth.toISOString()})`,
            sourceValue: `${sourceCalendarDate} (Raw Sheet Col G: "${sourceRow[6]}")`,
            proposedValue: `${sourceCalendarDate} (via Asia/Kolkata date-only rendering, or DB normalization to ${parsedExcelDob.isoDate}T12:00:00.000Z)`,
            confidence: "CONFIRMED",
            actionType: "SAFE_CODE_FIX",
            reason: `Timezone shift: Stored as 18:30 UTC of preceding day causes naive UTC display to show 1 day early (${currentPdfDisplay} vs source ${sourceCalendarDate}).`,
          });
        }
      }
    } else if (gRecord && gRecord.dateOfBirth && p.dateOfBirth) {
      const parsedGDob = parseExcelDateRaw(gRecord.dateOfBirth);
      if (parsedGDob) {
        const currentPdfDisplay = formatDbDateUtc(p.dateOfBirth);
        const sourceCalendarDate = parsedGDob.display;
        if (currentPdfDisplay !== sourceCalendarDate) {
          dobShiftCount++;
          changes.push({
            profileId: p.profileId,
            legacyProfileId: p.legacyProfileId,
            candidateName,
            fieldName: "Date of Birth (dateOfBirth)",
            currentValue: `${currentPdfDisplay} (Stored UTC: ${p.dateOfBirth.toISOString()})`,
            sourceValue: `${sourceCalendarDate} (G-Series Source: "${gRecord.dateOfBirth}")`,
            proposedValue: `${sourceCalendarDate} (via Asia/Kolkata date-only rendering)`,
            confidence: "CONFIRMED",
            actionType: "SAFE_CODE_FIX",
            reason: `Timezone shift: Naive UTC renders 1 day early (${currentPdfDisplay} vs source ${sourceCalendarDate}).`,
          });
        }
      }
    }

    // =========================================================================
    // FIELD 2: Birth Time
    // =========================================================================
    const currentBirthTime = p.birthTime?.trim();
    if (currentBirthTime && (currentBirthTime.includes("1899") || (!isNaN(Number(currentBirthTime)) && Number(currentBirthTime) < 1))) {
      birthTimeFixCount++;
      const formattedClean = parseExcelTimeFraction(currentBirthTime) || currentBirthTime;
      const sourceColVal = sourceRow ? sourceRow[8] : gRecord?.birthTime;
      changes.push({
        profileId: p.profileId,
        legacyProfileId: p.legacyProfileId,
        candidateName,
        fieldName: "Birth Time (birthTime)",
        currentValue: currentBirthTime,
        sourceValue: sourceColVal ? `Raw: "${sourceColVal}"` : "Excel fractional serial time",
        proposedValue: formattedClean,
        confidence: "CONFIRMED",
        actionType: "SAFE_CODE_FIX",
        reason: `Legacy epoch string or raw decimal ("${currentBirthTime.slice(0, 30)}...") converted to clean standardized 12-hour format ("${formattedClean}").`,
      });
    }

    // =========================================================================
    // FIELD 3: Work Location vs Designation
    // =========================================================================
    const currentProfession = p.occupation?.profession?.trim();
    const currentOccField = p.education?.occupationField?.trim();

    // Check if education.occupationField was duplicated from profession
    if (currentOccField && currentProfession && currentOccField.toLowerCase() === currentProfession.toLowerCase()) {
      workLocationDuplicateCount++;
      const sourceAddress = sourceRow ? String(sourceRow[13] || '').trim() : gRecord?.residence;
      changes.push({
        profileId: p.profileId,
        legacyProfileId: p.legacyProfileId,
        candidateName,
        fieldName: "Work Location (education.occupationField)",
        currentValue: `"${currentOccField}" (Duplicated with Profession)`,
        sourceValue: `Sheet Col L (Occupation): "${currentProfession}" | Col N (Residential Address): "${sourceAddress || '-'}"`,
        proposedValue: `- (Job title removed from Work Location. Residential address not assumed. Flagged for verified work city input)`,
        confidence: "CONFIRMED",
        actionType: "SAFE_CODE_FIX",
        reason: `Occupation/job title was mistakenly duplicated into education.occupationField during import. Per strict policy, residential address is not assumed to be work location.`,
      });
    }

    // =========================================================================
    // FIELD 4: Gender & Prefix Consistency
    // =========================================================================
    const currentGender = p.user?.gender;
    const prefixGender = legId.includes("-G-") || legId.startsWith("G-") || legId.startsWith("NNVS-G") || legId.startsWith("G0")
      ? "FEMALE"
      : legId.includes("-B-") || legId.startsWith("B-") || legId.startsWith("NNVS-B") || legId.startsWith("B0")
      ? "MALE"
      : null;

    if (sourceRow) {
      const sourceGenderRaw = String(sourceRow[4] || "").trim();
      const sourceGenderNorm = sourceGenderRaw.toLowerCase().includes("female") ? "FEMALE" : sourceGenderRaw.toLowerCase().includes("male") ? "MALE" : null;

      // Confirmed or Ambiguous Mismatch
      if (sourceGenderNorm && currentGender && sourceGenderNorm !== currentGender) {
        genderConflictCount++;
        changes.push({
          profileId: p.profileId,
          legacyProfileId: p.legacyProfileId,
          candidateName,
          fieldName: "Gender (user.gender)",
          currentValue: currentGender,
          sourceValue: `Col E: "${sourceGenderRaw}" (${sourceGenderNorm})`,
          proposedValue: `FLAGGED FOR MANUAL ADMIN REVIEW (Current DB is ${currentGender}, Source Col E says ${sourceGenderNorm}, Prefix implies ${prefixGender})`,
          confidence: "AMBIGUOUS",
          actionType: "MANUAL_VERIFICATION_REQUIRED",
          reason: `Form response Col E (${sourceGenderNorm}) disagrees with database gender (${currentGender}). Manual confirmation required.`,
        });
      }
    }

    // =========================================================================
    // FIELD 5: Marital Status
    // =========================================================================
    if (sourceRow) {
      const sourceMs = String(sourceRow[5] || "").trim();
      if (sourceMs && p.maritalStatus && sourceMs.toLowerCase() !== p.maritalStatus.toLowerCase()) {
        maritalStatusMismatchCount++;
        changes.push({
          profileId: p.profileId,
          legacyProfileId: p.legacyProfileId,
          candidateName,
          fieldName: "Marital Status (maritalStatus)",
          currentValue: p.maritalStatus,
          sourceValue: sourceMs,
          proposedValue: `${sourceMs} (Pending admin approval)`,
          confidence: "HIGH",
          actionType: "MANUAL_VERIFICATION_REQUIRED",
          reason: `Google Sheet source specifies "${sourceMs}" but database record has "${p.maritalStatus}".`,
        });
      }
    }

    const hasAmbiguity = changes.some((c) => c.confidence === "AMBIGUOUS" || c.confidence === "FLAGGED_FOR_REVIEW");

    allSummaries.push({
      profileId: p.profileId,
      legacyProfileId: p.legacyProfileId,
      candidateName,
      sourceStatus,
      sourceDetail,
      changesCount: changes.length,
      hasAmbiguity,
      changes,
    });

    allProposedChanges.push(...changes);
  }

  // Summary statistics
  const profilesWithChanges = allSummaries.filter((s) => s.changesCount > 0);
  const profilesWithZeroChanges = allSummaries.filter((s) => s.changesCount === 0);
  const profilesWithAmbiguities = allSummaries.filter((s) => s.hasAmbiguity);

  console.log("================================================================================");
  console.log("FULL DATASET PREVIEW SUMMARY TOTALS");
  console.log("================================================================================");
  console.log(`Total Unique Profiles Checked          : ${profiles.length}`);
  console.log(`- Matched to Google Sheet Rows         : ${matchedExcelCount}`);
  console.log(`- Matched to G-Series Archive          : ${matchedGSeriesCount}`);
  console.log(`- Unmatched (No Reliable Source Row)   : ${noSourceMatchCount}`);
  console.log(`--------------------------------------------------------------------------------`);
  console.log(`Total Proposed Field Corrections       : ${allProposedChanges.length}`);
  console.log(`  1. Date of Birth Calendar Shift Fixes: ${dobShiftCount}`);
  console.log(`  2. Birth Time Legacy String Fixes    : ${birthTimeFixCount}`);
  console.log(`  3. Work Location Duplicate Removals  : ${workLocationDuplicateCount}`);
  console.log(`  4. Ambiguous Gender Conflict Records : ${genderConflictCount}`);
  console.log(`  5. Marital Status Mismatch Records   : ${maritalStatusMismatchCount}`);
  console.log(`--------------------------------------------------------------------------------`);
  console.log(`Profiles Requiring Corrections         : ${profilesWithChanges.length}`);
  console.log(`Profiles with Ambiguities / Flagged    : ${profilesWithAmbiguities.length}`);
  console.log(`Profiles Requiring NO Changes          : ${profilesWithZeroChanges.length}`);

  // Write full detailed preview JSON
  fs.writeFileSync(
    "scripts/full-dataset-correction-preview.json",
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totals: {
          uniqueProfilesChecked: profiles.length,
          matchedExcel: matchedExcelCount,
          matchedGSeries: matchedGSeriesCount,
          unmatched: noSourceMatchCount,
          totalFieldCorrections: allProposedChanges.length,
          dobShiftCount,
          birthTimeFixCount,
          workLocationDuplicateCount,
          genderConflictCount,
          maritalStatusMismatchCount,
          profilesWithChanges: profilesWithChanges.length,
          profilesWithAmbiguities: profilesWithAmbiguities.length,
          profilesWithZeroChanges: profilesWithZeroChanges.length,
        },
        summaries: allSummaries,
      },
      null,
      2
    )
  );

  console.log(`\nFull complete report written to: scripts/full-dataset-correction-preview.json`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
