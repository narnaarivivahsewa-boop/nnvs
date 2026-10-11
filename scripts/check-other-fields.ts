import * as XLSX from "xlsx";
import { prisma } from "../lib/prisma";

async function main() {
  const wb = XLSX.readFile("NNVS (Responses).xlsx");
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const excelByLegId = new Map<string, any[]>();
  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || !row[0]) continue;
    const legId = String(row[0]).trim().toUpperCase();
    excelByLegId.set(legId, row);
  }

  const dbProfiles = await prisma.profile.findMany({
    where: { legacyProfileId: { not: null } },
    include: {
      user: true,
      family: true,
      education: true,
      occupation: true,
      phoneNumbers: true,
    },
  });

  let heightMismatches = 0;
  let incomeMismatches = 0;
  let fatherMismatches = 0;
  let motherMismatches = 0;
  let birthPlaceMismatches = 0;
  let birthTimeMismatches = 0;

  for (const p of dbProfiles) {
    const legId = p.legacyProfileId!.toUpperCase().trim();
    const excelRow = excelByLegId.get(legId);
    if (!excelRow) continue;

    // Col 9: Height
    const exHeight = String(excelRow[9] || '').trim();
    if (exHeight && p.height && !exHeight.includes(p.height.replace(/['"]/g, '')) && !p.height.includes(exHeight)) {
      heightMismatches++;
    }

    // Col 12: Income
    const exIncome = String(excelRow[12] || '').trim();
    if (exIncome && p.occupation?.annualIncome && exIncome !== p.occupation.annualIncome) {
      incomeMismatches++;
    }

    // Col 7: Birth Place
    const exBp = String(excelRow[7] || '').trim();
    if (exBp && p.birthPlace && exBp.toLowerCase() !== p.birthPlace.toLowerCase()) {
      birthPlaceMismatches++;
    }

    // Col 8: Birth Time
    const exBt = String(excelRow[8] || '').trim();
    if (exBt && p.birthTime && exBt !== p.birthTime) {
      birthTimeMismatches++;
    }

    // Col 16: Father Name
    const exFather = String(excelRow[16] || '').trim();
    if (exFather && p.family?.fatherName && exFather.toLowerCase() !== p.family.fatherName.toLowerCase()) {
      fatherMismatches++;
    }

    // Col 18: Mother Name
    const exMother = String(excelRow[18] || '').trim();
    if (exMother && p.family?.motherName && exMother.toLowerCase() !== p.family.motherName.toLowerCase()) {
      motherMismatches++;
    }
  }

  console.log("=== OTHER FIELD INTEGRITY CHECK (511 Matched Legacy Profiles) ===");
  console.log(`Height normalization differences: ${heightMismatches}`);
  console.log(`Income mismatches: ${incomeMismatches}`);
  console.log(`Birth Place mismatches: ${birthPlaceMismatches}`);
  console.log(`Birth Time mismatches: ${birthTimeMismatches}`);
  console.log(`Father Name mismatches: ${fatherMismatches}`);
  console.log(`Mother Name mismatches: ${motherMismatches}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
