import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import {
  generateBiodataPdfBuffer,
  saveBiodataPdfLocally,
  getBiodataCategoryFolder,
} from "./biodata-generator";

export interface BatchGenerationResult {
  total: number;
  alreadyPresentCount: number;
  newlyGeneratedCount: number;
  failedCount: number;
  categoryStats: Record<string, { present: number; generated: number }>;
  generatedList: string[];
}

export async function generateMissingPaidPdfs(): Promise<BatchGenerationResult> {
  console.log("================================================================================");
  console.log("RISHTECLUB / NNVS - SCAN & GENERATE MISSING PAID BIODATA PDFS (BATCH)");
  console.log("================================================================================");

  const defaultDDir = "D:\\NNVS\\Website Bio PDF";
  const baseDir =
    process.env.PDF_STORAGE_DIR && process.env.PDF_STORAGE_DIR.trim()
      ? process.env.PDF_STORAGE_DIR.trim()
      : fs.existsSync("D:\\")
      ? defaultDDir
      : path.join(process.cwd(), "storage", "biodatas");

  console.log(`Target Storage Root: ${baseDir}`);

  // Fetch only paid or payment-exempt profiles
  const paidProfiles = await prisma.profile.findMany({
    where: {
      OR: [{ paymentCompleted: true }, { isPaymentExempted: true }],
    },
    include: {
      user: true,
      photos: {
        orderBy: { isPrimary: "desc" },
      },
      family: true,
      education: true,
      occupation: true,
      partnerPreference: true,
      phoneNumbers: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const total = paidProfiles.length;
  console.log(`Found ${total} total paid/payment-exempt candidate profiles in database.`);

  let alreadyPresentCount = 0;
  let newlyGeneratedCount = 0;
  let failedCount = 0;

  const categoryStats: Record<string, { present: number; generated: number }> = {
    "Divorced Female": { present: 0, generated: 0 },
    "Divorced Male": { present: 0, generated: 0 },
    "Never Married Female": { present: 0, generated: 0 },
    "Never Married Male": { present: 0, generated: 0 },
  };

  const generatedList: string[] = [];

  for (let i = 0; i < total; i++) {
    const p = paidProfiles[i];
    const category = getBiodataCategoryFolder(p as any);
    const targetDir = path.join(baseDir, category);

    const candidateName = (p.user?.fullName || p.firstName || "Candidate")
      .replace(/[^a-zA-Z0-9_\u0900-\u097F -]/g, "_")
      .trim();
    const code = (p.legacyProfileId || p.profileId || p.id || "").replace(/[^a-zA-Z0-9_-]/g, "_");
    const exactFileName = `${code ? `${code}_` : ""}${candidateName}.pdf`;
    const exactFilePath = path.join(targetDir, exactFileName);

    // Check if file exists either with exact name or matching profile ID prefix
    let exists = false;
    const legacyId = p.legacyProfileId;
    const profId = p.profileId;
    if (fs.existsSync(exactFilePath)) {
      exists = true;
    } else if (fs.existsSync(targetDir)) {
      const filesInDir = fs.readdirSync(targetDir);
      if (
        (code && filesInDir.some((f) => f.startsWith(`${code}_`) || f.includes(code))) ||
        (profId && filesInDir.some((f) => f.includes(profId))) ||
        (legacyId && filesInDir.some((f) => f.includes(legacyId)))
      ) {
        exists = true;
      }
    }

    if (exists) {
      alreadyPresentCount++;
      if (categoryStats[category]) categoryStats[category].present++;
      continue;
    }

    // Missing PDF: Generate & Save
    try {
      console.log(`[${i + 1}/${total}] Generating missing PDF for ${p.profileId} (${p.legacyProfileId || "No Old ID"} - ${candidateName})...`);
      const pdfBuffer = await generateBiodataPdfBuffer(p as any);
      const saveRes = await saveBiodataPdfLocally(p as any, pdfBuffer);

      if (saveRes.success) {
        newlyGeneratedCount++;
        if (categoryStats[category]) categoryStats[category].generated++;
        generatedList.push(`${p.profileId} (${category}) -> ${path.basename(saveRes.filePath)}`);
        console.log(`  ✅ Saved: ${saveRes.filePath}`);
      } else {
        failedCount++;
        console.error(`  ❌ Failed to save: ${saveRes.error}`);
      }
    } catch (err: any) {
      failedCount++;
      console.error(`  ❌ Generation error for ${p.profileId}: ${err?.message || err}`);
    }
  }

  console.log("\n================================================================================");
  console.log("BATCH GENERATION SUMMARY:");
  console.log("================================================================================");
  console.log(`Total Paid Profiles Evaluated : ${total}`);
  console.log(`PDFs Already Existing on Disk : ${alreadyPresentCount}`);
  console.log(`Newly Generated & Saved PDFs  : ${newlyGeneratedCount}`);
  console.log(`Failures                      : ${failedCount}`);
  console.log("Breakdown by Category:");
  for (const [cat, stats] of Object.entries(categoryStats)) {
    console.log(`  - ${cat.padEnd(25)}: ${stats.present} existing, ${stats.generated} generated`);
  }
  console.log("================================================================================\n");

  return {
    total,
    alreadyPresentCount,
    newlyGeneratedCount,
    failedCount,
    categoryStats,
    generatedList,
  };
}
