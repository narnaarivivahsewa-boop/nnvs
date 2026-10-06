const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const totalProfiles = await prisma.profile.count();
  const visibleProfiles = await prisma.profile.count({ where: { isVisible: true } });
  const paymentCompletedProfiles = await prisma.profile.count({ where: { paymentCompleted: true } });
  const approvedProfiles = await prisma.profile.count({ where: { approvalStatus: 'APPROVED' } });
  const sourceGoogleForm = await prisma.profile.count({ where: { source: 'GOOGLE_FORM' } });

  console.log({
    totalProfiles,
    visibleProfiles,
    paymentCompletedProfiles,
    approvedProfiles,
    sourceGoogleForm
  });

  const latestProfiles = await prisma.profile.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      profileId: true,
      legacyProfileId: true,
      sourceId: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      isVisible: true,
      paymentCompleted: true,
    }
  });
  console.log('Latest 10 Profiles:', JSON.stringify(latestProfiles, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
