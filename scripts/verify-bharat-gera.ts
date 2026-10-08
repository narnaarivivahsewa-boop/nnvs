import { prisma } from "../lib/prisma";
import { generateBiodataPdfBuffer, saveBiodataPdfLocally } from "../lib/pdf/biodata-generator";

async function main() {
  const p = await prisma.profile.findFirst({
    where: { legacyProfileId: "NNVS-B-0053" },
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

  if (!p) {
    console.log("NNVS-B-0053 not found!");
    return;
  }

  // Ensure MALE and Never Married
  await prisma.user.update({
    where: { id: p.userId },
    data: { gender: "MALE" },
  });

  await prisma.profile.update({
    where: { id: p.id },
    data: { maritalStatus: "Never Married" },
  });

  const updated = await prisma.profile.findUnique({
    where: { id: p.id },
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

  console.log("NNVS-B-0053 Updated State:", {
    profileId: updated?.profileId,
    legacyProfileId: updated?.legacyProfileId,
    name: `${updated?.firstName} ${updated?.lastName}`,
    userGender: updated?.user?.gender,
    maritalStatus: updated?.maritalStatus,
  });

  const pdfBuffer = await generateBiodataPdfBuffer(updated as any);
  const res = await saveBiodataPdfLocally(updated as any, pdfBuffer);
  console.log("PDF generated to:", res);
}

main().catch(console.error).finally(() => prisma.$disconnect());
