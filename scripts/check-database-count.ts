import { prisma } from "@/lib/prisma";

async function main() {
  const userCount = await prisma.user.count();
  const profileCount = await prisma.profile.count();

  const profiles = await prisma.profile.findMany({
    select: {
      profileId: true,
    },
    orderBy: {
      profileId: "asc",
    },
  });

  console.log("======================================");
  console.log("DATABASE CHECK");
  console.log("======================================");
  console.log("USERS:", userCount);
  console.log("PROFILES:", profileCount);
  console.log("PROFILE IDs:", profiles.length);
  console.log("======================================");

  console.log(
    profiles.map((p) => p.profileId).join(", ")
  );
}

main()
  .catch((error) => {
    console.error("ERROR:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });