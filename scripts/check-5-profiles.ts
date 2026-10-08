import { prisma } from "../lib/prisma";

async function checkSpecific() {
  const searchTerms = ["0009", "0060", "0084", "0096", "0200", "200", "Khushbu", "Krati", "Mansi", "Diksha", "Nishant"];
  
  const profiles = await prisma.profile.findMany({
    where: {
      OR: [
        { legacyProfileId: { in: ["NNVS-G-0009", "NNVS-G-0060", "NNVS-G-0084", "NNVS-G-0096", "NNVS-B-0200", "NNVS-B-200", "NNVS-G-60", "NNVS-G-84", "NNVS-G-96", "NNVS-G-9"] } },
        { firstName: { in: ["Khushbu", "Krati", "Mansi", "Diksha", "Nishant"], mode: "insensitive" } },
        { user: { fullName: { in: ["Khushbu Arora", "Krati Seth", "Mansi", "Diksha", "Nishant Grover"], mode: "insensitive" } } },
      ]
    },
    include: { user: true }
  });

  console.log("Profiles Found (" + profiles.length + "):");
  for (const p of profiles) {
    console.log({
      id: p.id,
      profileId: p.profileId,
      legacyProfileId: p.legacyProfileId,
      name: `${p.firstName} ${p.lastName}`,
      userFullName: p.user?.fullName,
      userGender: p.user?.gender,
      maritalStatus: p.maritalStatus,
      sourceId: p.sourceId
    });
  }
}

checkSpecific().catch(console.error).finally(() => prisma.$disconnect());
