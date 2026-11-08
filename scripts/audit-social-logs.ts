import { prisma } from "../lib/prisma";

async function main() {
  const logs = await prisma.socialPostLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  console.log(`Found ${logs.length} recent social post logs:`);
  for (const log of logs) {
    console.log("-----------------------------------------");
    console.log(`ID: ${log.id}`);
    console.log(`Created: ${log.createdAt.toISOString()} (UTC) / ${new Date(log.createdAt.getTime() + 5.5 * 3600 * 1000).toISOString()} (IST)`);
    console.log(`Slot: ${log.slot} | Status: ${log.status} | Platform: ${log.platform} | TriggeredBy: ${log.triggeredBy}`);
    console.log(`CandidateId: ${log.candidateId}`);
    console.log(`Image: ${log.imageUrl}`);
    console.log(`IG Media: ${log.instagramMediaId} | FB Post: ${log.facebookPostId}`);
    if (log.error) {
      console.log(`Error: ${log.error}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

