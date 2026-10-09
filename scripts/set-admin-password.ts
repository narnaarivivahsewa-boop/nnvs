import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const adminAccounts = [
    { mobile: "9871592002", fullName: "NNVS Admin" },
    { mobile: "9577540005", fullName: "Rahul Dhamija" },
  ];

  const rawPassword = "Ritika@0612";
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  for (const admin of adminAccounts) {
    const existing = await prisma.user.findUnique({
      where: { mobile: admin.mobile },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          password: hashedPassword,
          role: "ADMIN",
          status: "ACTIVE",
          mobileVerified: true,
          fullName: existing.fullName || admin.fullName,
        },
      });
      console.log(`Updated ADMIN user ${admin.mobile} with password.`);
    } else {
      await prisma.user.create({
        data: {
          fullName: admin.fullName,
          mobile: admin.mobile,
          password: hashedPassword,
          role: "ADMIN",
          status: "ACTIVE",
          mobileVerified: true,
        },
      });
      console.log(`Created new ADMIN user ${admin.mobile} with password.`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

