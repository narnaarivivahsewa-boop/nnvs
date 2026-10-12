import { prisma } from "../lib/prisma";

async function benchmark() {
  console.log("==================================================");
  console.log("PHASE 1: RE-TESTING PRODUCTION ENDPOINTS (5 RUNS)");
  console.log("==================================================");

  const endpoints = [
    { name: "/api/public/stats", url: "https://www.rishteclub.com/api/public/stats" },
    { name: "/api/public/profiles (Default 24)", url: "https://www.rishteclub.com/api/public/profiles" },
    { name: "/api/public/profiles (Filter: Female)", url: "https://www.rishteclub.com/api/public/profiles?gender=FEMALE" },
  ];

  for (const ep of endpoints) {
    console.log(`\nTesting ${ep.name}:`);
    const results: number[] = [];
    let lastSize = 0;
    let lastStatus = 0;

    for (let i = 1; i <= 5; i++) {
      const start = Date.now();
      try {
        const res = await fetch(ep.url, {
          headers: {
            "User-Agent": "Rishteclub-Audit-Benchmark/1.0",
            "Cache-Control": "no-cache",
          },
        });
        const duration = Date.now() - start;
        const text = await res.text();
        results.push(duration);
        lastSize = text.length;
        lastStatus = res.status;
        console.log(`  Run ${i}: Status ${res.status} | Time: ${duration}ms | Payload: ${text.length} bytes`);
      } catch (err: any) {
        console.log(`  Run ${i}: FAILED - ${err.message}`);
      }
    }

    const avg = Math.round(results.reduce((a, b) => a + b, 0) / results.length);
    const min = Math.min(...results);
    const max = Math.max(...results);
    console.log(`  -> Summary for ${ep.name}: Min: ${min}ms, Max: ${max}ms, Avg: ${avg}ms (Status ${lastStatus})`);
  }

  console.log("\n==================================================");
  console.log("PHASE 1: DATABASE DIRECT QUERY ISOLATION (5 RUNS)");
  console.log("==================================================");

  console.log("\n1. Measuring Stats Query (3 Counts in Parallel)...");
  for (let i = 1; i <= 5; i++) {
    const start = Date.now();
    await Promise.all([
      prisma.profile.count({
        where: {
          isVisible: true,
          OR: [{ paymentCompleted: true }, { approvalStatus: "APPROVED" }],
          user: { gender: "FEMALE" },
        },
      }),
      prisma.profile.count({
        where: {
          isVisible: true,
          OR: [{ paymentCompleted: true }, { approvalStatus: "APPROVED" }],
          user: { gender: "MALE" },
        },
      }),
      prisma.profile.count({
        where: {
          isVisible: true,
          OR: [{ paymentCompleted: true }, { approvalStatus: "APPROVED" }],
        },
      }),
    ]);
    const duration = Date.now() - start;
    console.log(`  Stats DB Query Run ${i}: ${duration}ms`);
  }

  console.log("\n2. Measuring Public Profiles Query (Count + FindMany with 24 items)...");
  const whereClause = {
    isVisible: true,
    OR: [{ paymentCompleted: true }, { approvalStatus: "APPROVED" as const }],
  };

  for (let i = 1; i <= 5; i++) {
    const start = Date.now();
    await Promise.all([
      prisma.profile.count({ where: whereClause }),
      prisma.profile.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 24,
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
          user: { select: { fullName: true, gender: true } },
          education: { select: { highestQualification: true, occupationField: true } },
          occupation: { select: { profession: true, company: true, annualIncome: true } },
          photos: { where: { isPrimary: true }, take: 1, select: { imageUrl: true, isPrimary: true } },
        },
      }),
    ]);
    const duration = Date.now() - start;
    console.log(`  Profiles DB Query Run ${i}: ${duration}ms`);
  }

  await prisma.$disconnect();
}

benchmark().catch(console.error);
