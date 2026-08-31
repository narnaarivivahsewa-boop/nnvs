import { prisma } from "@/lib/prisma";

async function main() {
  console.log("======================================");
  console.log("NNVS MEMBER PROFILE CLEANUP");
  console.log("======================================");

  const profiles = await prisma.profile.findMany({
    select: {
      id: true,
      userId: true,
      profileId: true,
    },
  });

  console.log(`Profiles found: ${profiles.length}`);

  if (profiles.length === 0) {
    console.log("No profiles found. Nothing to delete.");
    return;
  }

  const userIds = profiles.map((p) => p.userId);

  await prisma.$transaction(async (tx) => {
    // Delete profile-related records first
    await tx.profilePhoto.deleteMany({
      where: {
        profileId: {
          in: profiles.map((p) => p.id),
        },
      },
    });

    await tx.family.deleteMany({
      where: {
        profileId: {
          in: profiles.map((p) => p.id),
        },
      },
    });

    await tx.education.deleteMany({
      where: {
        profileId: {
          in: profiles.map((p) => p.id),
        },
      },
    });

    await tx.occupation.deleteMany({
      where: {
        profileId: {
          in: profiles.map((p) => p.id),
        },
      },
    });

    await tx.partnerPreference.deleteMany({
      where: {
        profileId: {
          in: profiles.map((p) => p.id),
        },
      },
    });

    // Delete profiles
    await tx.profile.deleteMany({
      where: {
        id: {
          in: profiles.map((p) => p.id),
        },
      },
    });

    // Delete member users only.
    // Admin/Vendor users are NOT touched.
    await tx.user.deleteMany({
      where: {
        id: {
          in: userIds,
        },
        role: "MEMBER",
      },
    });
  });

  const remainingProfiles = await prisma.profile.count();

  console.log("======================================");
  console.log("CLEANUP COMPLETE");
  console.log("======================================");
  console.log(`Profiles deleted: ${profiles.length}`);
  console.log(`Remaining profiles: ${remainingProfiles}`);
}

main()
  .catch((error) => {
    console.error("CLEANUP ERROR:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });