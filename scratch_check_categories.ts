import { prisma } from "./lib/prisma";

async function main() {
  const statuses = await prisma.profile.groupBy({
    by: ["maritalStatus"],
    _count: { id: true },
  });
  console.log("Marital statuses in DB:", statuses);

  const cross = await prisma.profile.findMany({
    select: {
      maritalStatus: true,
      user: { select: { gender: true } }
    }
  });

  const categoryCounts: Record<string, number> = {
    "Divorced Female": 0,
    "Divorced Male": 0,
    "Never Married Female": 0,
    "Never Married Male": 0,
    "Other/Unknown": 0,
  };

  for (const p of cross) {
    const gender = (p.user?.gender || "MALE").toUpperCase();
    const ms = (p.maritalStatus || "").toLowerCase().trim();

    const isFemale = gender === "FEMALE";
    const isMale = gender === "MALE";

    const isDivorcedOrWidowOrAnnulled =
      ms.includes("divorc") ||
      ms.includes("widow") ||
      ms.includes("annul") ||
      ms.includes("separat");

    if (isDivorcedOrWidowOrAnnulled) {
      if (isFemale) categoryCounts["Divorced Female"]++;
      else categoryCounts["Divorced Male"]++;
    } else {
      // Default to Never Married
      if (isFemale) categoryCounts["Never Married Female"]++;
      else categoryCounts["Never Married Male"]++;
    }
  }

  console.log("Category counts across 541 profiles:", categoryCounts);
}

main().catch(console.error).finally(() => prisma.$disconnect());
