import { prisma } from "../lib/prisma";

async function runExplainAnalyze() {
  console.log("================================================================================");
  console.log("1. RAW VERBATIM EXPLAIN (ANALYZE, BUFFERS, VERBOSE) ON REAL PRODUCTION QUERIES");
  console.log("================================================================================");

  // QUERY 1: Default Listing (Page 1)
  console.log("\n--- QUERY 1: Default Public Profiles Feed (LIMIT 24 OFFSET 0) ---");
  const plan1: any = await prisma.$queryRaw`
    EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
    SELECT p.id, p."profileId", p."firstName", p."lastName", p."createdAt", p."isVisible", p."paymentCompleted", p."approvalStatus"
    FROM "Profile" p
    WHERE p."isVisible" = true
      AND (p."paymentCompleted" = true OR p."approvalStatus" = 'APPROVED')
    ORDER BY p."createdAt" DESC
    LIMIT 24 OFFSET 0;
  `;
  for (const r of plan1) console.log(r["QUERY PLAN"]);

  // QUERY 2: Filtered by Gender (JOIN with User)
  console.log("\n--- QUERY 2: Gender Filtered (FEMALE) (LIMIT 24 OFFSET 0) ---");
  const plan2: any = await prisma.$queryRaw`
    EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
    SELECT p.id, p."profileId", p."firstName", p."lastName", p."createdAt", u.gender
    FROM "Profile" p
    INNER JOIN "User" u ON p."userId" = u.id
    WHERE p."isVisible" = true
      AND (p."paymentCompleted" = true OR p."approvalStatus" = 'APPROVED')
      AND u.gender = 'FEMALE'
    ORDER BY p."createdAt" DESC
    LIMIT 24 OFFSET 0;
  `;
  for (const r of plan2) console.log(r["QUERY PLAN"]);

  // QUERY 3: Community Filtered (Religion=Hindu AND Caste LIKE %Sharma%)
  console.log("\n--- QUERY 3: Community Filtered (Religion=Hindu, Caste=Sharma) (LIMIT 24 OFFSET 0) ---");
  const plan3: any = await prisma.$queryRaw`
    EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
    SELECT p.id, p."profileId", p."firstName", p."religion", p."caste", p."createdAt"
    FROM "Profile" p
    WHERE p."isVisible" = true
      AND (p."paymentCompleted" = true OR p."approvalStatus" = 'APPROVED')
      AND p."religion" = 'Hindu'
      AND p."caste" ILIKE '%Sharma%'
    ORDER BY p."createdAt" DESC
    LIMIT 24 OFFSET 0;
  `;
  for (const r of plan3) console.log(r["QUERY PLAN"]);

  // QUERY 4: Deep Pagination (Page 3: LIMIT 24 OFFSET 48)
  console.log("\n--- QUERY 4: Pagination (Page 3, OFFSET 48) ---");
  const plan4: any = await prisma.$queryRaw`
    EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
    SELECT p.id, p."profileId", p."firstName", p."lastName", p."createdAt"
    FROM "Profile" p
    WHERE p."isVisible" = true
      AND (p."paymentCompleted" = true OR p."approvalStatus" = 'APPROVED')
    ORDER BY p."createdAt" DESC
    LIMIT 24 OFFSET 48;
  `;
  for (const r of plan4) console.log(r["QUERY PLAN"]);

  await prisma.$disconnect();
}

runExplainAnalyze().catch(console.error);
