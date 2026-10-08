const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const profiles = await prisma.profile.findMany({
    select: { id: true, profileId: true, legacyProfileId: true, sourceId: true }
  });

  const rowMap = new Map();
  profiles.forEach(p => {
    const m = (p.sourceId || '').match(/row_(\d+)/);
    if (m) {
      const rowNum = parseInt(m[1], 10);
      rowMap.set(rowNum, p);
    }
  });

  const allRows = Array.from(rowMap.keys()).sort((a, b) => a - b);
  console.log(`Total profile count in DB: ${profiles.length}`);
  console.log(`Total profiles with row_ in sourceId: ${allRows.length}`);
  console.log(`Min row: ${allRows[0]}, Max row: ${allRows[allRows.length - 1]}`);

  const missing = [];
  for (let r = 2; r <= 631; r++) {
    if (!rowMap.has(r)) {
      missing.push(r);
    }
  }

  console.log(`Missing rows (count = ${missing.length}):`, missing);
}

check().catch(console.error).finally(() => prisma.$disconnect());
