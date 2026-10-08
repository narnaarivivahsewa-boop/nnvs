const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const p1 = await prisma.profile.findFirst({ where: { legacyProfileId: 'NNVS-B-0493' }, include: { user: true } });
  const p2 = await prisma.profile.findFirst({ where: { legacyProfileId: 'NNVS-B-0492' }, include: { user: true } });
  const p3 = await prisma.profile.findFirst({ where: { legacyProfileId: 'NNVS-G-0133' }, include: { user: true } });
  const p4 = await prisma.profile.findFirst({ where: { legacyProfileId: 'NNVS-B-0491' }, include: { user: true } });
  const p5 = await prisma.profile.findFirst({ where: { user: { fullName: { contains: 'Nitin Kaushik', mode: 'insensitive' } } }, include: { user: true } });
  const p6 = await prisma.profile.findFirst({ where: { user: { fullName: { contains: 'Mayank Sikka', mode: 'insensitive' } } }, include: { user: true } });

  console.log({
    'NNVS-B-0493': p1 ? { name: p1.user?.fullName, code: p1.legacyProfileId, sourceId: p1.sourceId, createdAt: p1.createdAt } : 'NOT_FOUND',
    'NNVS-B-0492': p2 ? { name: p2.user?.fullName, code: p2.legacyProfileId, sourceId: p2.sourceId, createdAt: p2.createdAt } : 'NOT_FOUND',
    'NNVS-G-0133': p3 ? { name: p3.user?.fullName, code: p3.legacyProfileId, sourceId: p3.sourceId, createdAt: p3.createdAt } : 'NOT_FOUND',
    'NNVS-B-0491': p4 ? { name: p4.user?.fullName, code: p4.legacyProfileId, sourceId: p4.sourceId, createdAt: p4.createdAt } : 'NOT_FOUND',
    'Nitin Kaushik': p5 ? { name: p5.user?.fullName, code: p5.legacyProfileId } : 'NOT_FOUND',
    'Mayank Sikka': p6 ? { name: p6.user?.fullName, code: p6.legacyProfileId } : 'NOT_FOUND',
  });

  const allProfiles = await prisma.profile.findMany({
    select: {
      legacyProfileId: true,
      sourceId: true,
      createdAt: true,
    }
  });

  // Find all row numbers stored in sourceId
  const rowNumbers = allProfiles
    .map(p => {
      const match = (p.sourceId || '').match(/row_(\d+)/);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter(Boolean)
    .sort((a, b) => a - b);

  console.log(`Total profiles with row_ sourceId: ${rowNumbers.length}`);
  console.log(`Min row in DB: ${rowNumbers[0]}, Max row in DB: ${rowNumbers[rowNumbers.length - 1]}`);

  // Check which rows between 2 and 629 are in DB
  const missingRows = [];
  const rowSet = new Set(rowNumbers);
  for (let r = 2; r <= 629; r++) {
    if (!rowSet.has(r)) {
      missingRows.push(r);
    }
  }
  console.log(`Missing row count between 2 and 629: ${missingRows.length}`);
  console.log('Sample missing rows:', missingRows.slice(0, 30));
  if (missingRows.length > 30) {
    console.log('Last missing rows:', missingRows.slice(-20));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
