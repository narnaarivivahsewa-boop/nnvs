import { prisma } from "../lib/prisma";

async function main() {
  const sample = await prisma.profile.findMany({
    where: { legacyProfileId: { in: ["NNVS-B-0005", "NNVS-B-0001", "NNVS-B-0003", "NNVS-B-0004", "NNVS-G-0001"] } },
    select: { legacyProfileId: true, birthTime: true, birthPlace: true, dateOfBirth: true }
  });
  console.log("DB birthTime values:", sample);
}

main().catch(console.error).finally(() => prisma.$disconnect());
