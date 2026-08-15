-- CreateEnum
CREATE TYPE "PromoDiscountType" AS ENUM ('PERCENTAGE');

-- CreateEnum
CREATE TYPE "PromoCodeStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'DISABLED');

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountType" "PromoDiscountType" NOT NULL DEFAULT 'PERCENTAGE',
    "discountValue" DECIMAL(5,2) NOT NULL,
    "assignedProfileId" TEXT,
    "assignedEmail" TEXT,
    "assignedMobile" TEXT,
    "status" "PromoCodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "usedPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE INDEX "PromoCode_assignedProfileId_idx" ON "PromoCode"("assignedProfileId");

-- CreateIndex
CREATE INDEX "PromoCode_assignedEmail_idx" ON "PromoCode"("assignedEmail");

-- CreateIndex
CREATE INDEX "PromoCode_assignedMobile_idx" ON "PromoCode"("assignedMobile");

-- CreateIndex
CREATE INDEX "PromoCode_status_idx" ON "PromoCode"("status");

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_assignedProfileId_fkey" FOREIGN KEY ("assignedProfileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
