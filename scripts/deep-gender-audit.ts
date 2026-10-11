import * as XLSX from "xlsx";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("================================================================================");
  console.log("DEEP GENDER AUDIT: EXCEL SOURCE vs PROFILE PREFIX vs DB USER GENDER vs PDF");
  console.log("================================================================================");

  const wb = XLSX.readFile("NNVS (Responses).xlsx");
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const excelRowsByLegId = new Map<string, any>();
  const excelRowsByRow = new Map<number, any>();

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;
    const legId = row[0] ? String(row[0]).trim().toUpperCase() : "";
    if (legId) excelRowsByLegId.set(legId, { rowNum: i + 1, row });
    excelRowsByRow.set(i + 1, { rowNum: i + 1, row });
  }

  const allDbProfiles = await prisma.profile.findMany({
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Checking all ${allDbProfiles.length} DB profiles against Excel...`);

  const prefixMismatchesInExcel: any[] = [];
  const dbGenderVsExcelMismatches: any[] = [];
  const dbGenderVsPrefixMismatches: any[] = [];
  const suspectedNameGenderMismatches: any[] = [];

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;
    const legId = row[0] ? String(row[0]).trim().toUpperCase() : "";
    const name = row[3] ? String(row[3]).trim() : "";
    const genderRaw = row[4] ? String(row[4]).trim() : "";
    const genderNorm = genderRaw.toLowerCase().includes("female") ? "FEMALE" : genderRaw.toLowerCase().includes("male") ? "MALE" : "UNKNOWN";

    const prefix = legId.includes("-G-") || legId.startsWith("G-") || legId.startsWith("NNVS-G") || legId.startsWith("G0")
      ? "FEMALE"
      : legId.includes("-B-") || legId.startsWith("B-") || legId.startsWith("NNVS-B") || legId.startsWith("B0")
      ? "MALE"
      : null;

    if (prefix && genderNorm !== "UNKNOWN" && prefix !== genderNorm) {
      prefixMismatchesInExcel.push({
        rowNum: i + 1,
        legId,
        name,
        excelGenderRaw: genderRaw,
        genderNorm,
        prefix,
      });
    }
  }

  console.log(`\n1. In Excel: Rows where Prefix says one gender but Col E (Gender) says the opposite: ${prefixMismatchesInExcel.length}`);
  prefixMismatchesInExcel.forEach((p) => {
    console.log(`   Row ${p.rowNum} | ID: ${p.legId} | Name: ${p.name} | Excel Col E: "${p.excelGenderRaw}" | Prefix implies: ${p.prefix}`);
  });

  // Now check DB profiles
  for (const p of allDbProfiles) {
    const legId = p.legacyProfileId ? p.legacyProfileId.toUpperCase().trim() : "";
    const prefix = legId.includes("-G-") || legId.startsWith("G-") || legId.startsWith("NNVS-G") || legId.startsWith("G0")
      ? "FEMALE"
      : legId.includes("-B-") || legId.startsWith("B-") || legId.startsWith("NNVS-B") || legId.startsWith("B0")
      ? "MALE"
      : null;

    const dbGender = p.user?.gender;

    // Check against Excel if found
    let excelRow = legId ? excelRowsByLegId.get(legId) : null;
    if (!excelRow && p.sourceId) {
      const match = p.sourceId.match(/ROW_(\d+)/);
      if (match) {
        excelRow = excelRowsByRow.get(parseInt(match[1], 10));
      }
    }

    if (excelRow) {
      const excelGenderRaw = excelRow.row[4] ? String(excelRow.row[4]).trim() : "";
      const excelGenderNorm = excelGenderRaw.toLowerCase().includes("female") ? "FEMALE" : excelGenderRaw.toLowerCase().includes("male") ? "MALE" : "UNKNOWN";
      if (excelGenderNorm !== "UNKNOWN" && dbGender !== excelGenderNorm) {
        dbGenderVsExcelMismatches.push({
          profileId: p.profileId,
          legacyProfileId: p.legacyProfileId,
          name: p.user?.fullName,
          excelGenderRaw,
          excelGenderNorm,
          dbGender,
          prefix,
          sourceId: p.sourceId,
        });
      }
    }

    if (prefix && dbGender && prefix !== dbGender) {
      dbGenderVsPrefixMismatches.push({
        profileId: p.profileId,
        legacyProfileId: p.legacyProfileId,
        name: p.user?.fullName,
        dbGender,
        prefix,
      });
    }
  }

  console.log(`\n2. DB profiles where DB Gender differs from Excel Col E: ${dbGenderVsExcelMismatches.length}`);
  dbGenderVsExcelMismatches.forEach((m) => {
    console.log(`   ${m.legacyProfileId || m.profileId} | ${m.name} | DB: ${m.dbGender} vs Excel: ${m.excelGenderNorm} | Prefix: ${m.prefix}`);
  });

  console.log(`\n3. DB profiles where DB Gender differs from Profile Prefix: ${dbGenderVsPrefixMismatches.length}`);
  dbGenderVsPrefixMismatches.forEach((m) => {
    console.log(`   ${m.legacyProfileId || m.profileId} | ${m.name} | DB: ${m.dbGender} vs Prefix implies: ${m.prefix}`);
  });

  // Now check how PDF renders gender:
  // In lib/pdf/biodata-generator.ts:
  // const gender = profile.user?.gender ? (profile.user.gender === "MALE" ? "Male (Groom)" : "Female (Bride)") : "-";
  // BUT in getBiodataCategoryFolder:
  // lines 555-562:
  // if (legacy.includes("-G-") || ...) isFemale = true;
  // else if (legacy.includes("-B-") || ...) isFemale = false;
  // else isFemale = gender === "FEMALE";
  // This means the PDF folder / categorization uses the prefix, NOT user.gender!
}

main().catch(console.error).finally(() => prisma.$disconnect());
