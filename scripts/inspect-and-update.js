const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  const noLegacy = await prisma.profile.findMany({
    where: { legacyProfileId: null },
    include: { user: true }
  });

  console.log('Profiles without legacyProfileId:', JSON.stringify(noLegacy.map(p => ({
    id: p.id,
    profileId: p.profileId,
    name: (p.firstName || '') + ' ' + (p.lastName || ''),
    userFullName: p.user ? p.user.fullName : '',
    mobile: p.user ? p.user.mobile : '',
    sourceId: p.sourceId
  })), null, 2));
}

inspect().catch(console.error).finally(() => prisma.$disconnect());
