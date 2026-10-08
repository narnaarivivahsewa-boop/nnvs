import { prisma } from "../lib/prisma";
import { generateBiodataPdfBuffer, saveBiodataPdfLocally } from "../lib/pdf/biodata-generator";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Looking up profile for Bharat gera / NNVS-B-0053...");

  const profile = await prisma.profile.findFirst({
    where: {
      OR: [
        { legacyProfileId: "NNVS-B-0053" },
        { firstName: { contains: "Bharat", mode: "insensitive" } },
      ],
    },
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

  if (!profile) {
    console.log("❌ Profile not found!");
    return;
  }

  console.log("Current Profile State:", {
    id: profile.id,
    profileId: profile.profileId,
    legacyProfileId: profile.legacyProfileId,
    name: `${profile.firstName} ${profile.lastName}`,
    userFullName: profile.user?.fullName,
    userGender: profile.user?.gender,
    maritalStatus: profile.maritalStatus,
  });

  // Update User Gender to MALE
  const updatedUser = await prisma.user.update({
    where: { id: profile.userId },
    data: {
      gender: "MALE",
      fullName: profile.user?.fullName || "Bharat gera",
    },
  });

  // Update Profile
  const updatedProfile = await prisma.profile.update({
    where: { id: profile.id },
    data: {
      maritalStatus: profile.maritalStatus || "Never Married",
    },
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

  console.log("\n✅ Successfully Updated Bharat gera to MALE:", {
    profileId: updatedProfile.profileId,
    legacyProfileId: updatedProfile.legacyProfileId,
    name: `${updatedProfile.firstName} ${updatedProfile.lastName}`,
    userGender: updatedUser.gender,
    maritalStatus: updatedProfile.maritalStatus,
  });

  // Clean up any old wrong category PDF
  const baseDir = "D:\\NNVS\\Website Bio PDF";
  const wrongPaths = [
    path.join(baseDir, "Divorced Female", "NNVS-B-0053_Bharat gera.pdf"),
    path.join(baseDir, "Never Married Female", "NNVS-B-0053_Bharat gera.pdf"),
    path.join(baseDir, "Divorced Male", "NNVS-B-0053_Bharat gera.pdf"),
  ];

  for (const p of wrongPaths) {
    if (fs.existsSync(p)) {
      try {
        fs.unlinkSync(p);
        console.log("Cleaned up old wrong PDF:", p);
      } catch (e) {}
    }
  }

  // Regenerate PDF and save to Never Married Male folder
  console.log("\nRegenerating PDF for Never Married Male folder...");
  const pdfBuffer = await generateBiodataPdfBuffer(updatedProfile as any);
  const result = await saveBiodataPdfLocally(updatedProfile as any, pdfBuffer);
  console.log("PDF Save Result:", result);
}

main().catch(console.error).finally(() => prisma.$disconnect());
