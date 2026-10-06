const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dinkarProfiles = await prisma.profile.findMany({
    where: {
      OR: [
        { firstName: { contains: 'Dinkar', mode: 'insensitive' } },
        { lastName: { contains: 'Sehgal', mode: 'insensitive' } }
      ]
    }
  });
  console.log('Found profiles:', dinkarProfiles.map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName}`, profileId: p.profileId, legacy: p.legacyProfileId })));
  
  const profileIds = dinkarProfiles.map(p => p.id);
  const payments = await prisma.payment.findMany({
    where: {
      OR: [
        { profileId: { in: profileIds } },
        { invoiceNumber: { not: null } }
      ]
    }
  });

  for (const p of payments) {
    console.log(`Payment ID: ${p.id}, ProfileID: ${p.profileId}, Invoice: ${p.invoiceNumber}, Amount: ${p.amount}`);
    if (profileIds.includes(p.profileId) && p.invoiceNumber) {
      await prisma.payment.update({
        where: { id: p.id },
        data: {
          invoiceNumber: null,
          invoiceDate: null,
          invoiceUrl: null,
        }
      });
      console.log(`Successfully cleared invoice for payment ${p.id}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
