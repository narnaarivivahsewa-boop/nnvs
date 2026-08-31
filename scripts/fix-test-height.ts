import { prisma } from "../lib/prisma";

async function main() {
  const profile = await prisma.profile.update({
    where: {
      profileId: "NNVS1786629308968",
    },
    data: {
      height: `6'0"`,
    },
  });

  console.log("UPDATED HEIGHT:", profile.height);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });