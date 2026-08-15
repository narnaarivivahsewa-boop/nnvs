/*
  Warnings:

  - A unique constraint covering the columns `[senderProfileId,receiverProfileId]` on the table `Interest` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "ProfilePhone" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfilePhone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfilePhone_profileId_phone_key" ON "ProfilePhone"("profileId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "Interest_senderProfileId_receiverProfileId_key" ON "Interest"("senderProfileId", "receiverProfileId");

-- AddForeignKey
ALTER TABLE "ProfilePhone" ADD CONSTRAINT "ProfilePhone_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
