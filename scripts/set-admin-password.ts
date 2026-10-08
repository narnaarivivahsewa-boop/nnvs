import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const mobile = "9871592002";
  const rawPassword = "Ritika@0612";
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  let user = await prisma.user.findUnique({
    where: { mobile },
  });

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE",
        mobileVerified: true,
      },
    });
    console.log("Updated existing user to ADMIN with password:", user);
  } else {
    user = await prisma.user.create({
      data: {
        fullName: "Admin (Ritika)",
        mobile,
        password: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE",
        mobileVerified: true,
      },
    });
    console.log("Created new ADMIN user with password:", user);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
