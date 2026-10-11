import { prisma } from "../lib/prisma";

async function main() {
  const smriti = await prisma.profile.findFirst({
    where: { legacyProfileId: 'NNVS-G-0079' },
    include: { user: true }
  });
  const akshay = await prisma.profile.findFirst({
    where: { legacyProfileId: 'NNVS-B-0409' },
    include: { user: true }
  });
  console.log('Smriti Batra in DB:', smriti ? `${smriti.profileId} | ${smriti.legacyProfileId} | ${smriti.sourceId} | ${smriti.user.fullName}` : 'NOT IN DB');
  console.log('Akshay in DB:', akshay ? `${akshay.profileId} | ${akshay.legacyProfileId} | ${akshay.sourceId} | ${akshay.user.fullName}` : 'NOT IN DB');
}

main().catch(console.error).finally(() => prisma.$disconnect());
