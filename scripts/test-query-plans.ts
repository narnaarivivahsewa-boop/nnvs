import { prisma } from "../lib/prisma";

async function testQueryPlans() {
  console.log("=== EXPLAIN ANALYZE ON REAL QUERIES ===");

  try {
    // Current query plan before index
    const plan1: any = await prisma.$queryRaw`
      EXPLAIN (ANALYZE, BUFFERS, COSTS)
      SELECT p.id, p."profileId", p."firstName", p."lastName", p."createdAt"
      FROM "Profile" p
      WHERE p."isVisible" = true
        AND (p."paymentCompleted" = true OR p."approvalStatus" = 'APPROVED')
      ORDER BY p."createdAt" DESC
      LIMIT 24 OFFSET 0;
    `;

    console.log("\n1. Current Query Plan for Public Profiles (LIMIT 24):");
    for (const row of plan1) {
      console.log("  ", row["QUERY PLAN"]);
    }

    const plan2: any = await prisma.$queryRaw`
      EXPLAIN (ANALYZE, BUFFERS, COSTS)
      SELECT COUNT(*)
      FROM "Profile" p
      WHERE p."isVisible" = true
        AND (p."paymentCompleted" = true OR p."approvalStatus" = 'APPROVED');
    `;

    console.log("\n2. Current Query Plan for Public Count:");
    for (const row of plan2) {
      console.log("  ", row["QUERY PLAN"]);
    }
  } catch (err: any) {
    console.error("Query Plan Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testQueryPlans();
