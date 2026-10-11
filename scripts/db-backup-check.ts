import { prisma } from "../lib/prisma";

async function verifyDbState() {
  console.log("=== NEON POSTGRESQL DATABASE STATE & BACKUP CHECK ===");
  const [
    users,
    profiles,
    payments,
    otps,
    photos,
    families,
    educations,
    occupations,
    partnerPreferences,
    adminSettings,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.profile.count(),
    prisma.payment.count(),
    prisma.oTP.count(),
    prisma.profilePhoto.count(),
    prisma.family.count(),
    prisma.education.count(),
    prisma.occupation.count(),
    prisma.partnerPreference.count(),
    prisma.adminSetting.count(),
  ]);

  const state = {
    timestamp: new Date().toISOString(),
    tableCounts: {
      User: users,
      Profile: profiles,
      Payment: payments,
      OTP: otps,
      ProfilePhoto: photos,
      Family: families,
      Education: educations,
      Occupation: occupations,
      PartnerPreference: partnerPreferences,
      AdminSetting: adminSettings,
    },
  };

  console.log(JSON.stringify(state, null, 2));
  await prisma.$disconnect();
}

verifyDbState().catch(console.error);
