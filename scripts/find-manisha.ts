import { prisma } from "../lib/prisma";

async function findManisha() {
  // 1. Revert Bharat gera
  const bharat = await prisma.profile.findFirst({
    where: { legacyProfileId: "NNVS-B-0053" },
    include: { user: true },
  });
  if (bharat) {
    await prisma.user.update({
      where: { id: bharat.userId },
      data: { gender: "MALE" },
    });
    await prisma.profile.update({
      where: { id: bharat.id },
      data: { maritalStatus: "Never Married" },
    });
    console.log("Reverted Bharat gera to MALE / Never Married.");
  }

  // 2. Search for Manisha Chandna across all fields
  const allProfiles = await prisma.profile.findMany({
    include: { user: true },
  });

  const matched = allProfiles.filter(p => {
    const full = `${p.firstName} ${p.lastName} ${p.user?.fullName} ${p.legacyProfileId} ${p.notes} ${p.sourceId}`.toLowerCase();
    return full.includes("manisha") || full.includes("chandna") || full.includes("0053");
  });

  console.log("Matches found:", JSON.stringify(matched.map(m => ({
    id: m.id,
    profileId: m.profileId,
    legacyProfileId: m.legacyProfileId,
    name: `${m.firstName} ${m.lastName}`,
    userFullName: m.user?.fullName,
    userGender: m.user?.gender,
    maritalStatus: m.maritalStatus,
    sourceId: m.sourceId,
    notes: m.notes
  })), null, 2));
}

findManisha().catch(console.error).finally(() => prisma.$disconnect());
