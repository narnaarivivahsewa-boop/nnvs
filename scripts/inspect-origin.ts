import { prisma } from "../lib/prisma";

async function main() {
  const targetProfiles = await prisma.profile.findMany({
    where: {
      legacyProfileId: {
        in: ['NNVS-B-0406', 'NNVS-B-0408', 'NNVS-B-0409', 'NNVS-B-0414', 'NNVS-B-0478']
      }
    },
    include: { user: true }
  });

  for (const p of targetProfiles) {
    console.log("--------------------------------------------------");
    console.log(`Legacy: ${p.legacyProfileId} | ID: ${p.profileId} | Name: ${p.user.fullName}`);
    console.log(`Source: ${p.source} | SourceId: ${p.sourceId}`);
    console.log(`Created: ${p.createdAt} | Gender: ${p.user.gender} | MS: ${p.maritalStatus}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
