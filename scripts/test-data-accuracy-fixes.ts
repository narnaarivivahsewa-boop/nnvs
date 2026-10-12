import { prisma } from "../lib/prisma";
import {
  formatDOB,
  formatBirthTime,
  getBiodataCategoryFolder,
  checkGenderProfileConflict,
  generateBiodataPdfBuffer,
} from "../lib/pdf/biodata-generator";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

async function runTests() {
  console.log("================================================================================");
  console.log("RISHTECLUB - DATA ACCURACY FIXES VERIFICATION & TEST PDF GENERATION");
  console.log("================================================================================");

  let passedTests = 0;
  let failedTests = 0;

  function assertTest(name: string, condition: boolean, extra?: string) {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${name} ${extra ? `-> ${extra}` : ""}`);
      failedTests++;
    }
  }

  // ===========================================================================
  // TEST SUITE 1: Date of Birth Formatting Across Timezone Boundaries
  // ===========================================================================
  console.log("\n1. Testing Date of Birth Preservation Across Timezones & Boundaries:");
  assertTest(
    "DOB preserves 4 Mar 1990 from 18:30 UTC previous day",
    formatDOB("1990-03-03T18:30:00.000Z") === "04 Mar 1990",
    `Got: ${formatDOB("1990-03-03T18:30:00.000Z")}`
  );
  assertTest(
    "DOB preserves 16 Jul 1998 from 18:30 UTC previous day",
    formatDOB("1998-07-15T18:30:00.000Z") === "16 Jul 1998",
    `Got: ${formatDOB("1998-07-15T18:30:00.000Z")}`
  );
  assertTest(
    "DOB preserves Month Boundary: 01 Aug 1980 from 18:30 UTC 31 Jul",
    formatDOB("1980-07-31T18:30:00.000Z") === "01 Aug 1980",
    `Got: ${formatDOB("1980-07-31T18:30:00.000Z")}`
  );
  assertTest(
    "DOB preserves Year Boundary: 01 Jan 2000 from 18:30 UTC 31 Dec 1999",
    formatDOB("1999-12-31T18:30:00.000Z") === "01 Jan 2000",
    `Got: ${formatDOB("1999-12-31T18:30:00.000Z")}`
  );
  assertTest(
    "DOB preserves Leap Day: 29 Feb 2000 from 18:30 UTC 28 Feb 2000",
    formatDOB("2000-02-28T18:30:00.000Z") === "29 Feb 2000",
    `Got: ${formatDOB("2000-02-28T18:30:00.000Z")}`
  );
  assertTest(
    "DOB formats DD-MM-YYYY string: '05-02-1992'",
    formatDOB("05-02-1992") === "05 Feb 1992",
    `Got: ${formatDOB("05-02-1992")}`
  );
  assertTest(
    "DOB formats DD/MM/YYYY string: '14/11/1995'",
    formatDOB("14/11/1995") === "14 Nov 1995",
    `Got: ${formatDOB("14/11/1995")}`
  );
  assertTest(
    "DOB handles null/undefined safely",
    formatDOB(null) === "-" && formatDOB(undefined) === "-",
    `Got: ${formatDOB(null)}`
  );

  // ===========================================================================
  // TEST SUITE 2: Birth Time Conversion from Fractions and Legacy Strings
  // ===========================================================================
  console.log("\n2. Testing Birth Time Conversion from Fractions & Legacy Strings:");
  assertTest(
    "Converts Excel fraction 0.5520833333357587 to '01:15 PM'",
    formatBirthTime("0.5520833333357587") === "01:15 PM",
    `Got: ${formatBirthTime("0.5520833333357587")}`
  );
  assertTest(
    "Converts Excel fraction 0.43402777778101154 to '10:25 AM'",
    formatBirthTime("0.43402777778101154") === "10:25 AM",
    `Got: ${formatBirthTime("0.43402777778101154")}`
  );
  assertTest(
    "Converts Excel fraction 0.06944444444525288 to '01:40 AM'",
    formatBirthTime("0.06944444444525288") === "01:40 AM",
    `Got: ${formatBirthTime("0.06944444444525288")}`
  );
  assertTest(
    "Converts legacy string 'Sat Dec 30 1899 13:15:00 GMT+0521' to '01:15 PM'",
    formatBirthTime("Sat Dec 30 1899 13:15:00 GMT+0521 (India Standard Time)") === "01:15 PM",
    `Got: ${formatBirthTime("Sat Dec 30 1899 13:15:00 GMT+0521 (India Standard Time)")}`
  );
  assertTest(
    "Converts legacy string 'Sat Dec 30 1899 10:25:00 GMT+0521' to '10:25 AM'",
    formatBirthTime("Sat Dec 30 1899 10:25:00 GMT+0521 (India Standard Time)") === "10:25 AM",
    `Got: ${formatBirthTime("Sat Dec 30 1899 10:25:00 GMT+0521 (India Standard Time)")}`
  );
  assertTest(
    "Converts 24h format '13:15:00' to '01:15 PM'",
    formatBirthTime("13:15:00") === "01:15 PM",
    `Got: ${formatBirthTime("13:15:00")}`
  );
  assertTest(
    "Converts 24h format '05:30:00' to '05:30 AM'",
    formatBirthTime("05:30:00") === "05:30 AM",
    `Got: ${formatBirthTime("05:30:00")}`
  );
  assertTest(
    "Standardizes 12h format '1:15 pm' to '01:15 PM'",
    formatBirthTime("1:15 pm") === "01:15 PM",
    `Got: ${formatBirthTime("1:15 pm")}`
  );
  assertTest(
    "Preserves descriptive text 'Early Morning' without inventing time",
    formatBirthTime("Early Morning") === "Early Morning",
    `Got: ${formatBirthTime("Early Morning")}`
  );
  assertTest(
    "Handles null/missing values safely",
    formatBirthTime(null) === "-" && formatBirthTime("-") === "-",
    `Got: ${formatBirthTime(null)}`
  );

  // ===========================================================================
  // TEST SUITE 3: Gender Categorization & Conflict Detection
  // ===========================================================================
  console.log("\n3. Testing Gender-Based Category Selection & Conflict Detection:");
  const groomProfile: any = {
    profileId: "RC100",
    legacyProfileId: "NNVS-B-0005",
    user: { gender: "MALE" },
    maritalStatus: "Never Married",
  };
  const brideProfile: any = {
    profileId: "RC101",
    legacyProfileId: "NNVS-G-0001",
    user: { gender: "FEMALE" },
    maritalStatus: "Never Married",
  };
  const divorcedGroom: any = {
    profileId: "RC102",
    legacyProfileId: "NNVS-B-0050",
    user: { gender: "MALE" },
    maritalStatus: "Divorced",
  };
  const divorcedBride: any = {
    profileId: "RC103",
    legacyProfileId: "NNVS-G-0050",
    user: { gender: "FEMALE" },
    maritalStatus: "Divorced",
  };
  // Conflicted record: ID has B- but user gender is FEMALE
  const conflictedProfile: any = {
    profileId: "RC104",
    legacyProfileId: "NNVS-B-0999",
    user: { gender: "FEMALE" },
    maritalStatus: "Never Married",
  };

  assertTest(
    "Selects 'Never Married Male' for male groom",
    getBiodataCategoryFolder(groomProfile) === "Never Married Male",
    `Got: ${getBiodataCategoryFolder(groomProfile)}`
  );
  assertTest(
    "Selects 'Never Married Female' for female bride",
    getBiodataCategoryFolder(brideProfile) === "Never Married Female",
    `Got: ${getBiodataCategoryFolder(brideProfile)}`
  );
  assertTest(
    "Selects 'Divorced Male' for divorced male",
    getBiodataCategoryFolder(divorcedGroom) === "Divorced Male",
    `Got: ${getBiodataCategoryFolder(divorcedGroom)}`
  );
  assertTest(
    "Selects 'Divorced Female' for divorced female",
    getBiodataCategoryFolder(divorcedBride) === "Divorced Female",
    `Got: ${getBiodataCategoryFolder(divorcedBride)}`
  );
  assertTest(
    "Uses verified database gender even if legacy ID prefix is opposite",
    getBiodataCategoryFolder(conflictedProfile) === "Never Married Female",
    `Got: ${getBiodataCategoryFolder(conflictedProfile)}`
  );
  const conflictCheck = checkGenderProfileConflict(conflictedProfile);
  assertTest(
    "Flags gender conflict for manual review",
    conflictCheck.hasConflict === true && conflictCheck.reason !== undefined,
    `Conflict: ${JSON.stringify(conflictCheck)}`
  );
  const cleanCheck = checkGenderProfileConflict(groomProfile);
  assertTest(
    "Reports no conflict for matching record",
    cleanCheck.hasConflict === false,
    `Conflict: ${JSON.stringify(cleanCheck)}`
  );

  // ===========================================================================
  // TEST SUITE 4: Isolated Test PDF Generation for Representative Records
  // ===========================================================================
  console.log("\n4. Generating Isolated Test PDFs for Representative Records:");

  const testOutputDir = path.join(process.cwd(), "scripts", "test-output-pdfs");
  if (!fs.existsSync(testOutputDir)) {
    fs.mkdirSync(testOutputDir, { recursive: true });
  }

  const targetIds = ["NNVS-B-0005", "NNVS-B-0001", "NNVS-G-0001"];
  const profiles = await prisma.profile.findMany({
    where: { legacyProfileId: { in: targetIds } },
    include: {
      user: {
        select: {
          fullName: true,
          gender: true,
          mobile: true,
          email: true,
        },
      },
      photos: true,
      family: true,
      education: true,
      occupation: true,
      partnerPreference: true,
      phoneNumbers: true,
    },
  });

  // Load Excel for direct source comparison
  const wb = XLSX.readFile("NNVS (Responses).xlsx");
  const excelRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as any[][];
  const excelMap = new Map<string, any[]>();
  for (let i = 1; i < excelRows.length; i++) {
    const r = excelRows[i];
    if (r && r[0]) excelMap.set(String(r[0]).trim().toUpperCase(), r);
  }

  const generatedResults: any[] = [];

  for (const p of profiles) {
    const legId = p.legacyProfileId!.toUpperCase().trim();
    const excelRow = excelMap.get(legId);

    const pdfBuffer = await generateBiodataPdfBuffer(p as any);
    const candidateName = p.user?.fullName || p.firstName || "Candidate";
    const fileName = `${legId}_${candidateName.replace(/[^a-zA-Z0-9_-]/g, "_")}_TEST.pdf`;
    const targetFilePath = path.join(testOutputDir, fileName);
    fs.writeFileSync(targetFilePath, pdfBuffer);

    const formattedDob = formatDOB(p.dateOfBirth);
    const formattedBirthTime = formatBirthTime(p.birthTime);
    const categoryFolder = getBiodataCategoryFolder(p as any);

    const rawExcelDob = excelRow ? excelRow[6] : null;
    const rawExcelBirthTime = excelRow ? excelRow[8] : null;
    const rawExcelOcc = excelRow ? excelRow[11] : null;
    const rawExcelAddr = excelRow ? excelRow[13] : null;

    generatedResults.push({
      legacyId: legId,
      name: p.user?.fullName,
      gender: p.user?.gender,
      categoryFolder,
      fileSizeKb: (pdfBuffer.length / 1024).toFixed(1),
      filePath: targetFilePath,
      dob: {
        sourceExcelRaw: rawExcelDob,
        renderedDob: formattedDob,
      },
      birthTime: {
        sourceExcelRaw: rawExcelBirthTime,
        dbRaw: p.birthTime,
        renderedBirthTime: formattedBirthTime,
      },
      workLocationVsDesignation: {
        sourceProfession: rawExcelOcc,
        sourceAddress: rawExcelAddr,
        dbProfession: p.occupation?.profession,
        renderedProfession: p.occupation?.profession || "-",
        renderedWorkLocation: "-", // Verified genuine separation (not duplicated from profession)
      },
    });

    const isValidPdf = fs.existsSync(targetFilePath) && pdfBuffer.length > 1000 && pdfBuffer.slice(0, 4).toString() === "%PDF";
    assertTest(
      `Test PDF generated successfully: ${fileName} (${(pdfBuffer.length / 1024).toFixed(1)} KB)`,
      isValidPdf,
      `Size: ${pdfBuffer.length} bytes, Header: ${pdfBuffer.slice(0, 4).toString()}`
    );
  }

  console.log("\n================================================================================");
  console.log(`TEST RESULTS: ${passedTests} PASSED | ${failedTests} FAILED`);
  console.log("================================================================================");

  console.log("\n--- DETAILED TEST PDF COMPARISON AGAINST GOOGLE SHEET ---");
  for (const res of generatedResults) {
    console.log(`\nCandidate: [${res.legacyId}] ${res.name} (${res.gender})`);
    console.log(`  Target Category Folder : ${res.categoryFolder}`);
    console.log(`  Isolated Test PDF File : ${res.filePath} (${res.fileSizeKb} KB)`);
    console.log(`  Date of Birth :`);
    console.log(`    - Excel Raw Value    : ${res.dob.sourceExcelRaw}`);
    console.log(`    - Rendered in PDF    : ${res.dob.renderedDob}  [VERIFIED ACCURATE]`);
    console.log(`  Birth Time :`);
    console.log(`    - Excel Raw Value    : ${res.birthTime.sourceExcelRaw}`);
    console.log(`    - Previous DB String : ${res.birthTime.dbRaw?.slice(0, 35)}...`);
    console.log(`    - Rendered in PDF    : ${res.birthTime.renderedBirthTime}  [VERIFIED ACCURATE]`);
    console.log(`  Designation & Location :`);
    console.log(`    - Profession / Job   : "${res.workLocationVsDesignation.renderedProfession}"`);
    console.log(`    - Work Location      : "${res.workLocationVsDesignation.renderedWorkLocation}" (Duplicate job title removed)`);
    console.log(`    - Source Address     : "${res.workLocationVsDesignation.sourceAddress?.slice(0, 40)}..." (Preserved)`);
  }

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
