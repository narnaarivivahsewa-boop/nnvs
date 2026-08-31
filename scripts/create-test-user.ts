import { prisma } from "@/lib/prisma";

async function main() {
  const mobile = "9999999999";

  const existing = await prisma.user.findUnique({
    where: { mobile },
  });

  if (existing) {
    console.log("TEST USER ALREADY EXISTS");
    console.log({
      id: existing.id,
      fullName: existing.fullName,
      mobile: existing.mobile,
    });
    return;
  }

  const user = await prisma.user.create({
    data: {
      fullName: "NNVS Test User",
      mobile,
      gender: "MALE",
      role: "MEMBER",
      status: "ACTIVE",
      mobileVerified: false,
    },
  });

  console.log("================================");
  console.log("TEST USER CREATED");
  console.log("================================");
  console.log({
    id: user.id,
    fullName: user.fullName,
    mobile: user.mobile,
    role: user.role,
    status: user.status,
  });
}

main()
  .catch((error) => {
    console.error("ERROR:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });