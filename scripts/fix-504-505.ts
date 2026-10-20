import { prisma } from "../lib/prisma";
import { autoGenerateAndSaveBiodataPdf } from "../lib/pdf/biodata-generator";
import fs from "fs";
import path from "path";

async function main() {
  console.log("================================================================================");
  console.log("CORRECTING DATABASE RECORDS & ISOLATING PROFILES NNVS-B-0504 & NNVS-B-0505");
  console.log("================================================================================");

  // 1. Locate Profile 504 (Ishan Khatter)
  const p504 = await prisma.profile.findFirst({
    where: {
      OR: [{ legacyProfileId: "NNVS-B-0504" }, { profileId: "RC1792481285683_4834" }],
    },
    include: { user: true, family: true, education: true, occupation: true },
  });

  if (!p504) {
    throw new Error("Profile NNVS-B-0504 not found in database!");
  }

  // 2. Locate Profile 505 (Hitesh Khatter)
  const p505 = await prisma.profile.findFirst({
    where: {
      OR: [{ legacyProfileId: "NNVS-B-0505" }, { profileId: "RC1792489898107_6943" }],
    },
    include: { user: true, family: true, education: true, occupation: true },
  });

  if (!p505) {
    throw new Error("Profile NNVS-B-0505 not found in database!");
  }

  console.log(`Found Profile 504: ID=${p504.id}, ProfileID=${p504.profileId}, LegacyID=${p504.legacyProfileId}`);
  console.log(`Found Profile 505: ID=${p505.id}, ProfileID=${p505.profileId}, LegacyID=${p505.legacyProfileId}`);

  // 3. Update User account to parent/contact name "Neeru Khatter"
  // (Both brothers share this contact mobile number 9255144256 and email neerukhatter29@gmail.com)
  if (p504.userId) {
    await prisma.user.update({
      where: { id: p504.userId },
      data: {
        fullName: "Neeru Khatter",
      },
    });
    console.log(`✓ Updated shared parent User (${p504.userId}) fullName to "Neeru Khatter"`);
  }

  // 4. Update Profile 504 (Ishan Khatter)
  await prisma.profile.update({
    where: { id: p504.id },
    data: {
      firstName: "Ishan",
      lastName: "Khatter",
      legacyProfileId: "NNVS-B-0504",
      dateOfBirth: new Date("1996-06-11T00:00:00.000Z"),
      height: "5'11\"",
      maritalStatus: "Never Married",
      birthPlace: "Hansi",
      birthTime: "12:55 PM",
      diet: "Veg",
      manglik: "No",
      contactPerson: "Mother",
      caste: "Arora",
      notes: "Near Old Bus Stand, Model Town, Hansi, Hisar, Haryana\nGotra: Khatter",
      isVisible: true,
      approvalStatus: "APPROVED",
      paymentCompleted: true,
      isPaymentExempted: true,
    },
  });

  await prisma.education.upsert({
    where: { profileId: p504.id },
    create: {
      profileId: p504.id,
      highestQualification: "B.Com, Stenographer, MBA",
      occupationField: "Senior Business Consultant & Entrepreneur",
    },
    update: {
      highestQualification: "B.Com, Stenographer, MBA",
      occupationField: "Senior Business Consultant & Entrepreneur",
    },
  });

  await prisma.occupation.upsert({
    where: { profileId: p504.id },
    create: {
      profileId: p504.id,
      profession: "Senior Business Consultant & Entrepreneur",
      annualIncome: "12-14 Lakh P.A.",
    },
    update: {
      profession: "Senior Business Consultant & Entrepreneur",
      annualIncome: "12-14 Lakh P.A.",
    },
  });

  await prisma.family.upsert({
    where: { profileId: p504.id },
    create: {
      profileId: p504.id,
      fatherName: "Mr. Rajinder Khatter",
      fatherOccupation: "Businessman",
      motherName: "Mrs. Neeru Khatter",
      motherOccupation: "Educator / Private Teacher",
      brothers: 0,
      sisters: 0,
      siblingsDetails: "One younger brother",
      familyType: "Nuclear",
      familyStatus: "Owned House",
    },
    update: {
      fatherName: "Mr. Rajinder Khatter",
      fatherOccupation: "Businessman",
      motherName: "Mrs. Neeru Khatter",
      motherOccupation: "Educator / Private Teacher",
      brothers: 0,
      sisters: 0,
      siblingsDetails: "One younger brother",
      familyType: "Nuclear",
      familyStatus: "Owned House",
    },
  });
  console.log(`✓ Restored Ishan Khatter's full specific details for Profile 504`);

  // 5. Update Profile 505 (Hitesh Khatter)
  await prisma.profile.update({
    where: { id: p505.id },
    data: {
      firstName: "Hitesh",
      lastName: "Khatter",
      legacyProfileId: "NNVS-B-0505",
      dateOfBirth: new Date("1997-08-24T00:00:00.000Z"),
      height: "5'8\"",
      maritalStatus: "Never Married",
      birthPlace: "Hansi",
      birthTime: "2:20 AM",
      diet: "Veg",
      manglik: "No",
      contactPerson: "Mother",
      caste: "Arora",
      notes: "Near Old Bus Stand, Model Town, Hansi, Hisar, Haryana\nGotra: Khatter",
      isVisible: true,
      approvalStatus: "APPROVED",
      paymentCompleted: true,
      isPaymentExempted: true,
    },
  });

  await prisma.education.upsert({
    where: { profileId: p505.id },
    create: {
      profileId: p505.id,
      highestQualification: "BBA",
      occupationField: "Businessman",
    },
    update: {
      highestQualification: "BBA",
      occupationField: "Businessman",
    },
  });

  await prisma.occupation.upsert({
    where: { profileId: p505.id },
    create: {
      profileId: p505.id,
      profession: "Businessman",
      annualIncome: "10-11 Lakhs P.A. (Approx)",
    },
    update: {
      profession: "Businessman",
      annualIncome: "10-11 Lakhs P.A. (Approx)",
    },
  });

  await prisma.family.upsert({
    where: { profileId: p505.id },
    create: {
      profileId: p505.id,
      fatherName: "Mr. Rajinder Khatter",
      fatherOccupation: "Businessman",
      motherName: "Mrs. Neeru Khatter",
      motherOccupation: "Educator / Private Teacher",
      brothers: 0,
      sisters: 0,
      siblingsDetails: "One brother",
      familyType: "Nuclear",
      familyStatus: "Owned House",
    },
    update: {
      fatherName: "Mr. Rajinder Khatter",
      fatherOccupation: "Businessman",
      motherName: "Mrs. Neeru Khatter",
      motherOccupation: "Educator / Private Teacher",
      brothers: 0,
      sisters: 0,
      siblingsDetails: "One brother",
      familyType: "Nuclear",
      familyStatus: "Owned House",
    },
  });
  console.log(`✓ Restored Hitesh Khatter's full specific details for Profile 505`);

  // 6. Clean up misnamed PDF if present
  const wrongPdfPath = "D:\\NNVS\\Website Bio PDF\\Never Married Male\\NNVS-B-0505_Ishan Khatter.pdf";
  if (fs.existsSync(wrongPdfPath)) {
    try {
      fs.unlinkSync(wrongPdfPath);
      console.log(`✓ Removed misnamed PDF: ${wrongPdfPath}`);
    } catch (e) {
      console.warn("Could not delete wrong PDF:", e);
    }
  }

  // 7. Regenerate correct PDFs for both profiles
  console.log("\nRegenerating PDF for NNVS-B-0504 (Ishan Khatter)...");
  const res504 = await autoGenerateAndSaveBiodataPdf(p504.id);
  console.log("  504 PDF Result:", res504.success ? res504.filePath : res504.error);

  console.log("Regenerating PDF for NNVS-B-0505 (Hitesh Khatter)...");
  const res505 = await autoGenerateAndSaveBiodataPdf(p505.id);
  console.log("  505 PDF Result:", res505.success ? res505.filePath : res505.error);

  // 8. Verify the two separate PDFs on disk
  const expected504Pdf = "D:\\NNVS\\Website Bio PDF\\Never Married Male\\NNVS-B-0504_Ishan Khatter.pdf";
  const expected505Pdf = "D:\\NNVS\\Website Bio PDF\\Never Married Male\\NNVS-B-0505_Hitesh Khatter.pdf";

  console.log("\n================================================================================");
  console.log("VERIFYING GENERATED PDF FILES ON DISK:");
  console.log("================================================================================");
  if (fs.existsSync(expected504Pdf)) {
    const s504 = fs.statSync(expected504Pdf);
    console.log(`✅ Verified Profile 504 PDF: ${expected504Pdf} (${s504.size} bytes)`);
  } else {
    console.error(`❌ Expected PDF not found: ${expected504Pdf}`);
  }

  if (fs.existsSync(expected505Pdf)) {
    const s505 = fs.statSync(expected505Pdf);
    console.log(`✅ Verified Profile 505 PDF: ${expected505Pdf} (${s505.size} bytes)`);
  } else {
    console.error(`❌ Expected PDF not found: ${expected505Pdf}`);
  }

  // 9. Display both profile records side-by-side
  const final504 = await prisma.profile.findUnique({
    where: { id: p504.id },
    include: { user: true, education: true, occupation: true },
  });
  const final505 = await prisma.profile.findUnique({
    where: { id: p505.id },
    include: { user: true, education: true, occupation: true },
  });

  console.log("\n================================================================================");
  console.log("FINAL DATABASE VERIFICATION:");
  console.log("================================================================================");
  console.log(`Profile 504:`);
  console.log(`  Candidate Name : ${final504?.firstName} ${final504?.lastName}`);
  console.log(`  Profile ID     : ${final504?.profileId} (Legacy: ${final504?.legacyProfileId})`);
  console.log(`  Qualification  : ${final504?.education?.highestQualification}`);
  console.log(`  Profession     : ${final504?.occupation?.profession} (${final504?.occupation?.annualIncome})`);
  console.log(`Profile 505:`);
  console.log(`  Candidate Name : ${final505?.firstName} ${final505?.lastName}`);
  console.log(`  Profile ID     : ${final505?.profileId} (Legacy: ${final505?.legacyProfileId})`);
  console.log(`  Qualification  : ${final505?.education?.highestQualification}`);
  console.log(`  Profession     : ${final505?.occupation?.profession} (${final505?.occupation?.annualIncome})`);
  console.log("================================================================================\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
