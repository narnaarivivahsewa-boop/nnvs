import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function seedAdmins() {
  console.log("Seeding / Verifying Admin Accounts...");

  const admins = [
    {
      mobile: "9871592002",
      fullName: "NNVS Admin (Rahul Dhamija)",
      email: "narnaarivivahsewa@gmail.com",
      gender: "MALE" as const,
    },
    {
      mobile: "9577540005",
      fullName: "Rahul Dhamija",
      email: "rahul.dhamija786@gmail.com",
      gender: "MALE" as const,
    },
  ];

  const defaultAdminPassword = await bcrypt.hash("Admin@NNVS2026!", 10);

  for (const admin of admins) {
    const existing = await prisma.user.findUnique({
      where: { mobile: admin.mobile },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: "ADMIN",
          status: "ACTIVE",
          mobileVerified: true,
          fullName: admin.fullName,
          // Only set password if not set
          ...(existing.password ? {} : { password: defaultAdminPassword }),
        },
      });
      console.log(`✓ Updated existing admin account: ${admin.mobile} (${admin.fullName}) -> role: ADMIN`);
    } else {
      await prisma.user.create({
        data: {
          mobile: admin.mobile,
          fullName: admin.fullName,
          email: admin.email,
          gender: admin.gender,
          role: "ADMIN",
          status: "ACTIVE",
          mobileVerified: true,
          password: defaultAdminPassword,
        },
      });
      console.log(`✓ Created new admin account: ${admin.mobile} (${admin.fullName}) -> role: ADMIN`);
    }
  }

  console.log("Admin accounts verification complete.");
}

seedAdmins()
  .catch((e) => {
    console.error("Seed admins error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
