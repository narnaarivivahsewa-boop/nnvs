import { prisma } from "../lib/prisma";
import { generateBiodataPdfBuffer, saveBiodataPdfLocally } from "../lib/pdf/biodata-generator";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Looking up profile for Manisha Chandna / NNVS-G-0053...");

  const profile = await prisma.profile.findFirst({
    where: {
      OR: [
        { legacyProfileId: "NNVS-G-0053" },
        { legacyProfileId: { contains: "0053", mode: "insensitive" } },
        { firstName: { contains: "Manisha", mode: "insensitive" } },
        { user: { fullName: { contains: "Manisha", mode: "insensitive" } } },
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

  // Update Profile & User to FEMALE and Divorced
  const updatedUser = await prisma.user.update({
    where: { id: profile.userId },
    data: {
      gender: "FEMALE",
      fullName: profile.user?.fullName || `${profile.firstName} ${profile.lastName || ""}`.trim(),
    },
  });

  const updatedProfile = await prisma.profile.update({
    where: { id: profile.id },
    data: {
      maritalStatus: profile.maritalStatus && profile.maritalStatus.toLowerCase().includes("divorc") ? profile.maritalStatus : "Divorced",
      notes: profile.notes || undefined,
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

  console.log("\n✅ Successfully Updated Profile & User to FEMALE / Divorced:", {
    profileId: updatedProfile.profileId,
    legacyProfileId: updatedProfile.legacyProfileId,
    name: `${updatedProfile.firstName} ${updatedProfile.lastName}`,
    userGender: updatedUser.gender,
    maritalStatus: updatedProfile.maritalStatus,
  });

  // Regenerate PDF and save to Divorced Female folder
  console.log("\nRegenerating PDF for Divorced Female folder...");
  const pdfBuffer = await generateBiodataPdfBuffer(updatedProfile as any);
  const result = await saveBiodataPdfLocally(updatedProfile as any, pdfBuffer);
  console.log("PDF Save Result:", result);

  // Check and remove old wrongly categorized file if in Divorced Male or Never Married Male
  const baseDir = "D:\\NNVS\\Website Bio PDF";
  const oldPaths = [
    path.join(baseDir, "Divorced Male", `${updatedProfile.legacyProfileId}_${updatedProfile.user?.fullName || updatedProfile.firstName}.pdf`),
    path.join(baseDir, "Never Married Male", `${updatedProfile.legacyProfileId}_${updatedProfile.user?.fullName || updatedProfile.firstName}.pdf`),
    path.join(baseDir, "Never Married Female", `${updatedProfile.legacyProfileId}_${updatedProfile.user?.fullName || updatedProfile.firstName}.pdf`),
  ];
  for (const p of oldPaths) {
    if (fs.existsSync(p)) {
      try {
        fs.unlinkSync(p);
        console.log("Cleaned up old wrong category PDF:", p);
      } catch (e) {}
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
