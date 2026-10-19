import { prisma } from "../lib/prisma";

async function main() {
  const expiryDate = new Date("2026-10-25T23:59:59.999+05:30");

  console.log("Creating/Upserting PromoCode 'SAMIKSHA251'...");

  // 1. PromoCode Table (Primary table used for payments & checkouts)
  const promo = await prisma.promoCode.upsert({
    where: { code: "SAMIKSHA251" },
    update: {
      discountType: "PERCENTAGE",
      discountValue: 46.69,
      status: "ACTIVE",
      expiresAt: expiryDate,
      usedAt: null,
      usedPaymentId: null,
      assignedProfileId: null,
      assignedEmail: null,
      assignedMobile: null,
    },
    create: {
      code: "SAMIKSHA251",
      discountType: "PERCENTAGE",
      discountValue: 46.69,
      status: "ACTIVE",
      expiresAt: expiryDate,
      usedAt: null,
      usedPaymentId: null,
      assignedProfileId: null,
      assignedEmail: null,
      assignedMobile: null,
    },
  });

  console.log("✓ PromoCode created successfully:", {
    id: promo.id,
    code: promo.code,
    status: promo.status,
    expiresAt: promo.expiresAt,
    usedAt: promo.usedAt,
  });

  // 2. Coupon Table (Secondary admin/system table)
  const coupon = await prisma.coupon.upsert({
    where: { code: "SAMIKSHA251" },
    update: {
      type: "FIXED",
      value: 219.82, // Discount from 470.82 to 251.00
      validFrom: new Date(),
      validTill: expiryDate,
      maxUses: 1,
      isActive: true,
    },
    create: {
      code: "SAMIKSHA251",
      type: "FIXED",
      value: 219.82,
      validFrom: new Date(),
      validTill: expiryDate,
      maxUses: 1,
      isActive: true,
    },
  });

  console.log("✓ Coupon created successfully:", {
    id: coupon.id,
    code: coupon.code,
    maxUses: coupon.maxUses,
    validTill: coupon.validTill,
    isActive: coupon.isActive,
  });

  console.log("\nALL SET! Coupon 'Samiksha251' is ready in database.");
}

main()
  .catch((e) => {
    console.error("Error creating coupon:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
