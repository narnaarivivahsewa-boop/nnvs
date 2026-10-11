import { prisma } from "../lib/prisma";
import * as XLSX from "xlsx";

async function main() {
  const ids = ['RC1791432731803_7314', 'RC1791432969670_7097', 'RC1791433444087_8520', 'RC1791461025511_8082', 'RC1791431315944_2560'];
  const profiles = await prisma.profile.findMany({
    where: { profileId: { in: ids } },
    include: { user: true, partnerPreference: true, family: true, occupation: true }
  });

  const wb = XLSX.readFile('NNVS (Responses).xlsx');
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as any[][];

  for (const p of profiles) {
    console.log("--------------------------------------------------");
    console.log(`DB PROFILE: ${p.profileId} | Legacy: ${p.legacyProfileId} | SourceId: ${p.sourceId}`);
    console.log(`User Name: ${p.user.fullName} | DB Gender: ${p.user.gender} | MS: ${p.maritalStatus}`);
    console.log(`Preferences: ${p.partnerPreference?.preferredCaste}`);
    
    // Check in Excel
    const matchRow = p.sourceId?.match(/ROW_(\d+)/i);
    if (matchRow) {
      const rNum = parseInt(matchRow[1], 10);
      const r = rows[rNum - 1];
      if (r) {
        console.log(`EXCEL ROW ${rNum}:`);
        console.log(`  Col A (Profile ID): "${r[0]}"`);
        console.log(`  Col D (Name): "${r[3]}"`);
        console.log(`  Col E (Gender): "${r[4]}"`);
        console.log(`  Col F (Marital Status): "${r[5]}"`);
        console.log(`  Col G (DOB): "${r[6]}"`);
        console.log(`  Col AA (Preferences): "${r[26]}"`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
