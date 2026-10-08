import { prisma } from "../lib/prisma";
import { generateBiodataPdfBuffer, saveBiodataPdfLocally } from "../lib/pdf/biodata-generator";
import fs from "fs";
import path from "path";

async function fixAndOrganizeAllPdfs() {
  const baseDir = "D:\\NNVS\\Website Bio PDF";
  const categories = [
    "Divorced Female",
    "Divorced Male",
    "Never Married Female",
    "Never Married Male",
  ];

  // 1. First, update all profiles in DB to have 100% correct Gender based on Legacy ID
  const allProfiles = await prisma.profile.findMany({
    include: {
      user: true,
      photos: true,
      family: true,
      education: true,
      occupation: true,
      partnerPreference: true,
      phoneNumbers: true,
    },
  });

  console.log(`Processing ${allProfiles.length} profiles...`);

  let genderUpdates = 0;

  for (const p of allProfiles) {
    const legacy = (p.legacyProfileId || "").toUpperCase();
    let expectedGender: "MALE" | "FEMALE" | null = null;

    if (legacy.includes("-G-") || legacy.startsWith("NNVS-G") || legacy.startsWith("G-")) {
      expectedGender = "FEMALE";
    } else if (legacy.includes("-B-") || legacy.startsWith("NNVS-B") || legacy.startsWith("B-")) {
      expectedGender = "MALE";
    }

    if (expectedGender && p.user?.gender !== expectedGender) {
      await prisma.user.update({
        where: { id: p.userId },
        data: { gender: expectedGender },
      });
      genderUpdates++;
      console.log(`Updated DB User Gender: ${p.legacyProfileId} (${p.firstName} ${p.lastName}) -> ${expectedGender}`);
    }
  }

  console.log(`\n✅ Total DB Gender Updates: ${genderUpdates}`);

  // 2. Clean up existing folders and regenerate all 630 PDFs accurately
  console.log("\nRegenerating all 630 PDFs with strict NNVS-G -> Female and NNVS-B -> Male rules...");

  // Empty existing category folders on D:\ drive to prevent duplicates/misplaced files
  for (const cat of categories) {
    const catPath = path.join(baseDir, cat);
    if (fs.existsSync(catPath)) {
      const files = fs.readdirSync(catPath);
      for (const f of files) {
        if (f.endsWith(".pdf")) {
          try {
            fs.unlinkSync(path.join(catPath, f));
          } catch (e) {}
        }
      }
    } else {
      fs.mkdirSync(catPath, { recursive: true });
    }
  }

  // Refetch all profiles
  const freshProfiles = await prisma.profile.findMany({
    include: {
      user: true,
      photos: true,
      family: true,
      education: true,
      occupation: true,
      partnerPreference: true,
      phoneNumbers: true,
    },
  });

  const categoryStats: Record<string, number> = {
    "Divorced Female": 0,
    "Divorced Male": 0,
    "Never Married Female": 0,
    "Never Married Male": 0,
  };

  for (const profile of freshProfiles) {
    try {
      const pdfBuffer = await generateBiodataPdfBuffer(profile as any);
      const res = await saveBiodataPdfLocally(profile as any, pdfBuffer);
      if (res.success && categoryStats[res.category] !== undefined) {
        categoryStats[res.category]++;
      }
    } catch (err: any) {
      console.error(`Error generating PDF for ${profile.legacyProfileId}:`, err.message);
    }
  }

  console.log("\n================================================================================");
  console.log("FINAL ACCURATE CATEGORY BREAKDOWN ON D:\\NNVS\\Website Bio PDF:");
  console.log("================================================================================");
  console.log(`📁 Divorced Female      : ${categoryStats["Divorced Female"]} PDFs`);
  console.log(`📁 Divorced Male        : ${categoryStats["Divorced Male"]} PDFs`);
  console.log(`📁 Never Married Female : ${categoryStats["Never Married Female"]} PDFs`);
  console.log(`📁 Never Married Male   : ${categoryStats["Never Married Male"]} PDFs`);
}

fixAndOrganizeAllPdfs().catch(console.error).finally(() => prisma.$disconnect());
