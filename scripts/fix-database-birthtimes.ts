import { prisma } from "../lib/prisma";
import { formatBirthTime } from "../lib/utils";

async function main() {
  console.log("================================================================================");
  console.log("UPDATING ALL PROFILES IN DATABASE WITH STANDARDIZED BIRTH TIME");
  console.log("================================================================================");

  const profiles = await prisma.profile.findMany({
    where: {
      birthTime: {
        not: null,
      },
    },
    select: {
      id: true,
      legacyProfileId: true,
      birthTime: true,
    },
  });

  console.log(`Found ${profiles.length} profiles with non-null birthTime in database.`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const p of profiles) {
    if (!p.birthTime) continue;
    const original = p.birthTime.trim();
    const formatted = formatBirthTime(original);

    if (formatted !== original && formatted !== "-") {
      await prisma.profile.update({
        where: { id: p.id },
        data: { birthTime: formatted },
      });
      updatedCount++;
      if (updatedCount <= 10 || original.includes("1899")) {
        // Log first few and 1899
        if (updatedCount <= 10) {
          console.log(`[${updatedCount}] ${p.legacyProfileId || p.id}: "${original}" -> "${formatted}"`);
        }
      }
    } else {
      skippedCount++;
    }
  }

  console.log("\n================================================================================");
  console.log("DATABASE BIRTH TIME UPDATE COMPLETE!");
  console.log(`Total checked: ${profiles.length}`);
  console.log(`Updated:       ${updatedCount}`);
  console.log(`Unchanged:     ${skippedCount}`);
  console.log("================================================================================");

  // Check NNVS-G-0003 specifically
  const g3 = await prisma.profile.findFirst({
    where: { legacyProfileId: "NNVS-G-0003" },
    select: { legacyProfileId: true, birthTime: true },
  });
  console.log("NNVS-G-0003 in DB now:", g3);

  // Verify no 1899 remain
  const remaining1899 = await prisma.profile.count({
    where: { birthTime: { contains: "1899" } },
  });
  console.log(`Profiles remaining with '1899' in birthTime: ${remaining1899}`);
}

main()
  .catch((err) => {
    console.error("Error updating database birth times:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
