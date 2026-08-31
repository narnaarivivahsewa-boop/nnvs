import { prisma } from "@/lib/prisma";

async function main() {
  const mobile = "9999999999";

  const user = await prisma.user.findUnique({
    where: {
      mobile,
    },
  });

  if (!user) {
    throw new Error("Test user not found.");
  }

  const existingProfile = await prisma.profile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (existingProfile) {
    console.log("PROFILE ALREADY EXISTS");
    console.log({
      id: existingProfile.id,
      profileId: existingProfile.profileId,
      userId: existingProfile.userId,
    });
    return;
  }

  const profile = await prisma.profile.create({
    data: {
      userId: user.id,

      profileId: "NNVS-TEST-0001",

      firstName: "NNVS Test",
      lastName: "User",

      
      profileCompletion: 0,

      isVisible: false,
      paymentCompleted: false,

      approvalStatus: "DRAFT",
    },
  });

  console.log("================================");
  console.log("TEST PROFILE CREATED");
  console.log("================================");

  console.log({
    userId: user.id,
    profileId: profile.profileId,
    profileDatabaseId: profile.id,
    approvalStatus: profile.approvalStatus,
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