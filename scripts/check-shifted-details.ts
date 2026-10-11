import { prisma } from "../lib/prisma";

async function main() {
  const ids = ['NNVS-B-0406', 'NNVS-B-0414', 'NNVS-B-0478', 'NNVS-B-0408'];
  for (const id of ids) {
    const p = await prisma.profile.findFirst({
      where: { legacyProfileId: id },
      include: { user: true }
    });
    console.log(`${id}: DB Name: "${p?.user.fullName}" | Gender: ${p?.user.gender} | MS: ${p?.maritalStatus} | SourceId: ${p?.sourceId}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
