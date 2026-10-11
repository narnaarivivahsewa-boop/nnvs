import { prisma } from "../lib/prisma";

async function main() {
  const p = await prisma.profile.findMany({
    where: { sourceId: { contains: '1gN9Xlq78evneaMxz8mXVn' } },
    select: { legacyProfileId: true, dateOfBirth: true },
    take: 10
  });
  console.log('Sample DOB from live sheet synced profiles:');
  p.forEach(x => console.log(x.legacyProfileId, x.dateOfBirth?.toISOString()));
}

main().catch(console.error).finally(() => prisma.$disconnect());
