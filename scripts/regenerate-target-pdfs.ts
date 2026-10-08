import { prisma } from "../lib/prisma";
import { generateBiodataPdfBuffer, saveBiodataPdfLocally } from "../lib/pdf/biodata-generator";

async function main() {
  // 1. Manisha Chandna
  const manisha = await prisma.profile.findFirst({
    where: { legacyProfileId: "NNVS-G-0053" },
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

  if (manisha) {
    const pdfBuffer = await generateBiodataPdfBuffer(manisha as any);
    const res = await saveBiodataPdfLocally(manisha as any, pdfBuffer);
    console.log("✅ Manisha Chandna PDF Save:", res);
  }

  // 2. Bharat gera
  const bharat = await prisma.profile.findFirst({
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

  if (bharat) {
    const pdfBuffer = await generateBiodataPdfBuffer(bharat as any);
    const res = await saveBiodataPdfLocally(bharat as any, pdfBuffer);
    console.log("✅ Bharat gera PDF Save:", res);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
