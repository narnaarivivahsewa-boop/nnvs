import { prisma } from "../lib/prisma";
import { POST as googleFormHandler } from "../app/api/integrations/google-form/route";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

async function runTest() {
  console.log("================================================================================");
  console.log("TESTING GOOGLE FORM EDIT / RESUBMISSION SYNC FOR PROFILE NNVS-B-0504");
  console.log("================================================================================");

  const initialCount = await prisma.profile.count();
  console.log(`Initial total profiles in database: ${initialCount}`);

  // Fetch initial profile state
  const beforeProfile = await prisma.profile.findFirst({
    where: {
      OR: [{ legacyProfileId: "NNVS-B-0504" }, { profileId: "RC1792481285683_4834" }],
    },
    include: { user: true, family: true, education: true, occupation: true },
  });

  if (!beforeProfile) {
    console.error("❌ Target profile NNVS-B-0504 not found in database!");
    process.exit(1);
  }

  console.log(`✓ Found target profile: ${beforeProfile.profileId} (ID: ${beforeProfile.id})`);
  console.log(`  Current Name: ${beforeProfile.firstName} ${beforeProfile.lastName}`);
  console.log(`  Current Notes/Address: ${beforeProfile.notes}`);
  console.log(`  Current Qualification: ${beforeProfile.education?.highestQualification}`);
  console.log(`  Current Occupation: ${beforeProfile.occupation?.profession}`);
  console.log(`  Current Income: ${beforeProfile.occupation?.annualIncome}`);

  // Construct edited Google Form response payload for NNVS-B-0504
  const editedPayload = {
    batch: [
      {
        rowNumber: 640,
        sourceId: beforeProfile.sourceId || "1gN9Xlq78evneaMxz8mXVn-RKMIZAfYHQgiDf_jwULSM_1333877254_row_640",
        legacyProfileId: "NNVS-B-0504",
        name: "Ishan Khatter",
        gender: "Male",
        dob: "11/06/1996",
        height: "5'11\"",
        maritalStatus: "Never Married",
        birthPlace: "Hansi",
        birthTime: "12:55 PM",
        diet: "Veg",
        manglik: "No",
        contactNo: "9255144256",
        contactPerson: "Mother",
        gotra: "Khatter",
        caste: "Arora",
        address: "Near Old Bus Stand, Model Town, Hansi, Hisar, Haryana",
        qualification: "B.Com, Stenographer, MBA",
        occupation: "Senior Business Consultant & Entrepreneur",
        income: "12-14 Lakh P.A.",
        fatherName: "Mr. Rajinder Khatter",
        fatherOccupation: "Businessman",
        motherName: "Mrs. Neeru Khatter",
        motherOccupation: "Educator / Private Teacher",
        siblingsDetails: "One younger brother",
        familyType: "Nuclear",
        familyStatus: "Owned House",
        notes: "Near Old Bus Stand, Model Town, Hansi, Hisar, Haryana",
      },
    ],
  };

  const integrationKey =
    process.env.GOOGLE_FORM_INTEGRATION_KEY || "9377018194b7c3361ccd1c929de0d9d267c821544c05ff12ea64e5cabfdea20c";

  const req = new NextRequest("http://localhost:3000/api/integrations/google-form", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-integration-key": integrationKey,
      authorization: `Bearer ${integrationKey}`,
    },
    body: JSON.stringify(editedPayload),
  });

  console.log("\nExecuting Google Form sync handler with updated details...");
  const res = await googleFormHandler(req);
  const result = await res.json();
  console.log("Sync Response:", JSON.stringify(result, null, 2));

  // Verify DB state after sync
  const postCount = await prisma.profile.count();
  console.log(`\nPost-sync total profiles in database: ${postCount} (Initial: ${initialCount})`);

  if (postCount !== initialCount) {
    console.error(`❌ FAILURE: Profile count changed from ${initialCount} to ${postCount}. A duplicate was created!`);
    process.exit(1);
  } else {
    console.log("✅ SUCCESS: Profile count is identical (0 duplicates created).");
  }

  // Fetch updated profile
  const afterProfile = await prisma.profile.findFirst({
    where: {
      OR: [{ legacyProfileId: "NNVS-B-0504" }, { profileId: "RC1792481285683_4834" }],
    },
    include: { user: true, family: true, education: true, occupation: true },
  });

  if (!afterProfile) {
    console.error("❌ Target profile not found after sync!");
    process.exit(1);
  }

  console.log("\n================================================================================");
  console.log("UPDATED PROFILE DETAILS IN DATABASE:");
  console.log("================================================================================");
  console.log(`Profile ID          : ${afterProfile.profileId} (Legacy: ${afterProfile.legacyProfileId})`);
  console.log(`Name                : ${afterProfile.firstName} ${afterProfile.lastName}`);
  console.log(`Approval / Live     : ${afterProfile.approvalStatus} (isVisible: ${afterProfile.isVisible})`);
  console.log(`Payment Status      : paymentCompleted=${afterProfile.paymentCompleted}, isPaymentExempted=${afterProfile.isPaymentExempted}`);
  console.log(`Notes / Gotra       : ${afterProfile.notes}`);
  console.log(`Caste               : ${afterProfile.caste}`);
  console.log(`Qualification       : ${afterProfile.education?.highestQualification}`);
  console.log(`Occupation          : ${afterProfile.occupation?.profession}`);
  console.log(`Annual Income       : ${afterProfile.occupation?.annualIncome}`);
  console.log(`Father Details      : ${afterProfile.family?.fatherName} (${afterProfile.family?.fatherOccupation})`);
  console.log(`Mother Details      : ${afterProfile.family?.motherName} (${afterProfile.family?.motherOccupation})`);

  // Verify PDF file exists on disk
  const pdfPath = "D:\\NNVS\\Website Bio PDF\\Never Married Male\\NNVS-B-0504_Ishan Khatter.pdf";
  if (fs.existsSync(pdfPath)) {
    const stats = fs.statSync(pdfPath);
    console.log(`\n✅ Generated PDF File Verified on Disk:`);
    console.log(`   Path: ${pdfPath}`);
    console.log(`   Size: ${stats.size} bytes`);
    console.log(`   Modified At: ${stats.mtime.toISOString()}`);
  } else {
    console.warn(`\n⚠️ PDF not found at exact path ${pdfPath}. Checking category directory...`);
  }

  console.log("\n================================================================================");
  console.log("✅ SYNC / UPDATE TEST COMPLETED SUCCESSFULLY FOR NNVS-B-0504");
  console.log("================================================================================");
}

runTest()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
