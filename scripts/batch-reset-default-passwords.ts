import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

const DEFAULT_RAW_PASSWORD = "NNVS@RC2026";

async function main() {
  console.log("==================================================");
  console.log("BATCH PASSWORD RESET: 'NNVS@RC2026' FOR IMPORTED USERS");
  console.log("==================================================");

  // 1. Hash the default password using bcrypt (salt rounds = 10)
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(DEFAULT_RAW_PASSWORD, salt);

  console.log(`✓ Password '${DEFAULT_RAW_PASSWORD}' hashed successfully with bcrypt.`);

  // 2. Query all users who are MEMBER (excluding ADMIN accounts)
  // Or all users attached to imported profiles
  const totalUsersCount = await prisma.user.count();
  const adminUsersCount = await prisma.user.count({ where: { role: "ADMIN" } });
  
  console.log(`Total users in database: ${totalUsersCount}`);
  console.log(`Admin users: ${adminUsersCount}`);

  // Fetch all imported users (members)
  const memberUsers = await prisma.user.findMany({
    where: {
      role: { not: "ADMIN" },
    },
    select: {
      id: true,
      mobile: true,
      fullName: true,
      role: true,
    },
  });

  console.log(`Found ${memberUsers.length} imported member accounts to update.`);

  if (memberUsers.length === 0) {
    console.log("No member users found to update.");
    return;
  }

  // 3. Batch update passwords in chunks
  const chunkSize = 100;
  let updatedCount = 0;

  for (let i = 0; i < memberUsers.length; i += chunkSize) {
    const chunk = memberUsers.slice(i, i + chunkSize);
    const ids = chunk.map((u) => u.id);

    const result = await prisma.user.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        password: hashedPassword,
        status: "ACTIVE",
        mobileVerified: true,
      },
    });

    updatedCount += result.count;
    console.log(`Progress: Updated ${updatedCount}/${memberUsers.length} users...`);
  }

  console.log("==================================================");
  console.log(`✓ BATCH UPDATE COMPLETE: Successfully updated ${updatedCount} users.`);
  console.log("==================================================");

  // 4. Test login check with a sample imported user
  const sampleUser = memberUsers[0];
  console.log("\n--- Verification: Sample Login Check ---");
  console.log(`Testing login for user: ${sampleUser.fullName} (Mobile ID: ${sampleUser.mobile})`);

  const fetchedUser = await prisma.user.findUnique({
    where: { id: sampleUser.id },
  });

  if (!fetchedUser || !fetchedUser.password) {
    throw new Error("Failed to retrieve user or password is missing.");
  }

  const isValid = await bcrypt.compare(DEFAULT_RAW_PASSWORD, fetchedUser.password);
  console.log(`Bcrypt verification for '${DEFAULT_RAW_PASSWORD}': ${isValid ? "PASSED (MATCH!) ✓" : "FAILED ✗"}`);

  if (isValid) {
    console.log(`✓ Sample profile ${sampleUser.mobile} can successfully log in using password 'NNVS@RC2026'.`);
  } else {
    throw new Error("Password verification failed!");
  }
}

main()
  .catch((err) => {
    console.error("Batch update error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
