import { prisma } from "../lib/prisma";

async function inspectIndexes() {
  console.log("=== POSTGRESQL EXISTING INDEXES INSPECTION ===");
  try {
    const indexes: any = await prisma.$queryRaw`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM
        pg_indexes
      WHERE
        schemaname = 'public'
      ORDER BY
        tablename,
        indexname;
    `;

    console.log(`Found ${indexes.length} total indexes in the public schema:\n`);
    for (const idx of indexes) {
      console.log(`[${idx.tablename}] ${idx.indexname}`);
      console.log(`  Definition: ${idx.indexdef}\n`);
    }
  } catch (err: any) {
    console.error("Index inspection failed:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

inspectIndexes();
