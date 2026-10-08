import { PrismaClient } from "@prisma/client";
import { generateBiodataPdfBuffer, saveBiodataPdfLocally } from "../lib/pdf/biodata-generator";

const prisma = new PrismaClient();

async function test() {
  const profile = await prisma.profile.findFirst({
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
    console.log("No profile found");
    return;
  }

  console.log("Generating sample biodata PDF for:", profile.user?.fullName, profile.legacyProfileId);
  const buffer = await generateBiodataPdfBuffer(profile as any);
  console.log("PDF buffer generated successfully! Size:", buffer.length, "bytes");

  const saveRes = await saveBiodataPdfLocally(profile as any, buffer);
  console.log("Saved local file result:", saveRes);
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
