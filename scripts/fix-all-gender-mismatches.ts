import { prisma } from "../lib/prisma";
import { generateBiodataPdfBuffer, saveBiodataPdfLocally } from "../lib/pdf/biodata-generator";
import fs from "fs";
import path from "path";

async function main() {
  console.log("================================================================================");
  console.log("SCANNING & FIXING GENDER MISMATCHES BASED ON NNVS-G / NNVS-B PREFIXES");
  console.log("================================================================================");

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

  console.log(`Total profiles in database: ${allProfiles.length}`);

  const fixedProfiles = [];
  const baseDir = "D:\\NNVS\\Website Bio PDF";

  for (const profile of allProfiles) {
    const legacyId = (profile.legacyProfileId || "").toUpperCase().trim();
    const currentGender = profile.user?.gender;
    let targetGender: "MALE" | "FEMALE" | null = null;

    if (legacyId.includes("-G-") || legacyId.startsWith("G-") || legacyId.startsWith("NNVS-G") || legacyId.startsWith("G0")) {
      targetGender = "FEMALE";
    } else if (legacyId.includes("-B-") || legacyId.startsWith("B-") || legacyId.startsWith("NNVS-B") || legacyId.startsWith("B0")) {
      targetGender = "MALE";
    }

    // Check specific profiles mentioned by user
    const name = `${profile.firstName} ${profile.lastName || ""}`.toLowerCase();
    if (name.includes("khushbu arora") || name.includes("krati seth") || name.includes("mansi") || name.includes("diksha")) {
      targetGender = "FEMALE";
    } else if (name.includes("nishant grover")) {
      targetGender = "MALE";
    }

    if (targetGender && currentGender !== targetGender) {
      console.log(`\nFixing Gender Mismatch for ${profile.legacyProfileId || profile.profileId} (${profile.firstName} ${profile.lastName}):`);
      console.log(`- Was: ${currentGender} -> Now: ${targetGender}`);

      // Update User
      await prisma.user.update({
        where: { id: profile.userId },
        data: { gender: targetGender },
      });

      // Fetch fresh updated profile
      const updatedProfile = await prisma.profile.findUnique({
        where: { id: profile.id },
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

      // Clean up old PDF from wrong folder
      if (updatedProfile) {
        const candidateName = (updatedProfile.user?.fullName || updatedProfile.firstName || "Candidate").replace(/[^a-zA-Z0-9_\u0900-\u097F -]/g, "_").trim();
        const code = (updatedProfile.legacyProfileId || updatedProfile.profileId || "").replace(/[^a-zA-Z0-9_-]/g, "_");
        const fileName = `${code ? `${code}_` : ""}${candidateName}.pdf`;

        const allPossibleCategories = [
          "Divorced Female",
          "Divorced Male",
          "Never Married Female",
          "Never Married Male",
        ];

        for (const cat of allPossibleCategories) {
          const oldFile = path.join(baseDir, cat, fileName);
          if (fs.existsSync(oldFile)) {
            try {
              fs.unlinkSync(oldFile);
              console.log(`  Cleaned up old PDF: ${oldFile}`);
            } catch (e) {}
          }
        }

        // Regenerate to correct category folder
        const pdfBuffer = await generateBiodataPdfBuffer(updatedProfile as any);
        const saveRes = await saveBiodataPdfLocally(updatedProfile as any, pdfBuffer);
        console.log(`  ✅ Saved to correct folder: [${saveRes.category}] -> ${path.basename(saveRes.filePath)}`);
      }

      fixedProfiles.push({
        id: profile.legacyProfileId || profile.profileId,
        name: `${profile.firstName} ${profile.lastName}`,
        oldGender: currentGender,
        newGender: targetGender,
      });
    }
  }

  console.log("\n================================================================================");
  console.log(`TOTAL FIXED PROFILES: ${fixedProfiles.length}`);
  console.log("================================================================================");
  console.log(JSON.stringify(fixedProfiles, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
