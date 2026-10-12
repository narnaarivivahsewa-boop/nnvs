import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { generateBiodataPdfBuffer, saveBiodataPdfLocally } from "../lib/pdf/biodata-generator";

const prisma = new PrismaClient();

async function main() {
  console.log("================================================================================");
  console.log("RISHTECLUB / NNVS MATRIMONY - BULK BIODATA PDF GENERATOR (WITHOUT CONTACT)");
  console.log("================================================================================");

  const baseTargetDir = "D:\\NNVS\\Website Bio PDF";
  const categoryFolders = [
    "Divorced Female without contact",
    "Divorced Male without contact",
    "Never Married Female without contact",
    "Never Married Male without contact",
  ];

  console.log(`Base Target Output Directory: ${baseTargetDir}`);

  // Create all 4 category directories if they don't already exist
  for (const cat of categoryFolders) {
    const fullCatDir = path.join(baseTargetDir, cat);
    try {
      if (!fs.existsSync(fullCatDir)) {
        fs.mkdirSync(fullCatDir, { recursive: true });
        console.log(`✅ Ready Folder: ${fullCatDir}`);
      }
    } catch (err: any) {
      console.error(`Warning: Could not create folder (${err.message}).`);
    }
  }

  // Fetch all profiles from DB
  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          fullName: true,
          gender: true,
          mobile: true,
          email: true,
        },
      },
      photos: {
        orderBy: { isPrimary: "desc" },
        select: {
          imageUrl: true,
          isPrimary: true,
        },
      },
      family: true,
      education: true,
      occupation: true,
      partnerPreference: true,
      phoneNumbers: {
        select: {
          phone: true,
          isPrimary: true,
        },
      },
    },
  });

  const total = profiles.length;
  console.log(`\nFound ${total} total profiles in database to process.`);

  let successCount = 0;
  let failCount = 0;
  const categoryStats: Record<string, number> = {
    "Divorced Female without contact": 0,
    "Divorced Male without contact": 0,
    "Never Married Female without contact": 0,
    "Never Married Male without contact": 0,
  };
  const errors: { id: string; name: string; error: string }[] = [];

  for (let i = 0; i < total; i++) {
    const profile = profiles[i];
    const candidateName = profile.user?.fullName || profile.firstName || "Candidate";
    const code = profile.legacyProfileId || profile.profileId || `P_${i + 1}`;

    try {
      // Generate PDF buffer without contact details
      const pdfBuffer = await generateBiodataPdfBuffer(profile as any, {
        hideContactDetails: true,
      });

      // Save to D:\NNVS\Website Bio PDF\[Category Folder without contact]
      const result = await saveBiodataPdfLocally(profile as any, pdfBuffer, {
        withoutContact: true,
      });

      if (result.success) {
        successCount++;
        if (categoryStats[result.category] !== undefined) {
          categoryStats[result.category]++;
        }
        const sizeKb = (pdfBuffer.length / 1024).toFixed(1);
        console.log(`[${i + 1}/${total}] ✅ [${result.category}] -> ${path.basename(result.filePath)} (${sizeKb} KB)`);
      } else {
        throw new Error(result.error || "Save returned false");
      }
    } catch (err: any) {
      failCount++;
      const errMsg = err?.message || String(err);
      console.error(`[${i + 1}/${total}] ❌ Failed: ${code} (${candidateName}) - ${errMsg}`);
      errors.push({ id: code, name: candidateName, error: errMsg });
    }
  }

  console.log("\n================================================================================");
  console.log("BULK PDF GENERATION (WITHOUT CONTACT) COMPLETED!");
  console.log("================================================================================");
  console.log(`Total Profiles Processed: ${total}`);
  console.log(`Successfully Generated & Saved: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log("\nCategory-wise Breakdown on D:\\NNVS\\Website Bio PDF (* without contact):");
  console.log(`📁 Divorced Female without contact      : ${categoryStats["Divorced Female without contact"]} PDFs`);
  console.log(`📁 Divorced Male without contact        : ${categoryStats["Divorced Male without contact"]} PDFs`);
  console.log(`📁 Never Married Female without contact : ${categoryStats["Never Married Female without contact"]} PDFs`);
  console.log(`📁 Never Married Male without contact   : ${categoryStats["Never Married Male without contact"]} PDFs`);

  if (errors.length > 0) {
    console.log("\nErrors Encountered:");
    console.log(JSON.stringify(errors, null, 2));
  }
}

main()
  .catch((err) => {
    console.error("Fatal error in bulk PDF generator (without contact):", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
