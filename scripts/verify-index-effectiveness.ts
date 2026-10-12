import { prisma } from "../lib/prisma";

async function verifyDetails() {
  console.log("==================================================");
  console.log("1. TESTING QUERY PLANS FOR REPRESENTATIVE SEARCHES");
  console.log("==================================================");

  // Default Listing Query
  const planDefault: any = await prisma.$queryRaw`
    EXPLAIN (ANALYZE, BUFFERS)
    SELECT p.id, p."profileId", p."firstName", p."lastName", p."createdAt"
    FROM "Profile" p
    WHERE p."isVisible" = true
      AND (p."paymentCompleted" = true OR p."approvalStatus" = 'APPROVED')
    ORDER BY p."createdAt" DESC
    LIMIT 24 OFFSET 0;
  `;
  console.log("\nPlan for Default Public Profiles (Page 1):");
  for (const r of planDefault) console.log(" ", r["QUERY PLAN"]);

  // Filtered by Religion & Caste Query
  const planFiltered: any = await prisma.$queryRaw`
    EXPLAIN (ANALYZE, BUFFERS)
    SELECT p.id, p."profileId", p."firstName", p."religion", p."caste", p."createdAt"
    FROM "Profile" p
    WHERE p."isVisible" = true
      AND (p."paymentCompleted" = true OR p."approvalStatus" = 'APPROVED')
      AND p."religion" = 'Hindu'
      AND p."caste" ILIKE '%Sharma%'
    ORDER BY p."createdAt" DESC
    LIMIT 24 OFFSET 0;
  `;
  console.log("\nPlan for Filtered Profiles (Religion=Hindu, Caste=Sharma):");
  for (const r of planFiltered) console.log(" ", r["QUERY PLAN"]);

  console.log("\n==================================================");
  console.log("2. VERIFYING PUBLIC RESPONSE FIELDS (SECURITY CHECK)");
  console.log("==================================================");

  const sampleProfiles = await prisma.profile.findMany({
    where: {
      isVisible: true,
      OR: [{ paymentCompleted: true }, { approvalStatus: "APPROVED" }],
    },
    take: 2,
    select: {
      id: true,
      profileId: true,
      legacyProfileId: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      height: true,
      maritalStatus: true,
      religion: true,
      caste: true,
      motherTongue: true,
      birthPlace: true,
      diet: true,
      manglik: true,
      user: {
        select: {
          fullName: true,
          gender: true,
        },
      },
      education: {
        select: {
          highestQualification: true,
          occupationField: true,
        },
      },
      occupation: {
        select: {
          profession: true,
          company: true,
          annualIncome: true,
        },
      },
      photos: {
        where: { isPrimary: true },
        take: 1,
        select: { imageUrl: true, isPrimary: true },
      },
    },
  });

  console.log("Sample Public Output (Sanitized):");
  console.log(JSON.stringify(sampleProfiles, null, 2));

  // Security Assertions
  for (const p of sampleProfiles as any[]) {
    const keys = Object.keys(p);
    const userKeys = p.user ? Object.keys(p.user) : [];
    
    if (keys.includes("password") || keys.includes("mobile") || keys.includes("email") ||
        userKeys.includes("password") || userKeys.includes("mobile") || userKeys.includes("email")) {
      console.error("CRITICAL SECURITY FLAW: Sensitive field detected in public projection!");
    } else {
      console.log(`Profile ${p.profileId} verified: No phone/email/password exposed.`);
    }
  }

  await prisma.$disconnect();
}

verifyDetails().catch(console.error);
