/*
  Warnings:

  - A unique constraint covering the columns `[profileId,shortlistedProfileId]` on the table `Shortlist` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PartnerPreference" ALTER COLUMN "minHeight" SET DATA TYPE TEXT,
ALTER COLUMN "maxHeight" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Profile" ALTER COLUMN "height" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Shortlist_profileId_shortlistedProfileId_key" ON "Shortlist"("profileId", "shortlistedProfileId");
