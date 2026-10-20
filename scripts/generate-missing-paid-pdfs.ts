import { generateMissingPaidPdfs } from "../lib/pdf/batch-generator";
import { prisma } from "../lib/prisma";

export { generateMissingPaidPdfs };

if (require.main === module) {
  generateMissingPaidPdfs()
    .catch((err) => {
      console.error("Batch script error:", err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
