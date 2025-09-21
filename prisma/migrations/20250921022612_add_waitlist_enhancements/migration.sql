/*
  Warnings:

  - A unique constraint covering the columns `[masterReferralCode]` on the table `apps` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."apps" ADD COLUMN     "autoInviteEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dailyInviteQuota" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "inviteTime" TEXT NOT NULL DEFAULT '09:00',
ADD COLUMN     "masterReferralCode" TEXT,
ADD COLUMN     "masterReferralCredits" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "waitlistEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "waitlistMessage" TEXT;

-- AlterTable
ALTER TABLE "public"."waitlist" ADD COLUMN     "convertedAt" TIMESTAMP(3),
ADD COLUMN     "invitationEmail" TEXT,
ADD COLUMN     "invitedVia" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "apps_masterReferralCode_key" ON "public"."apps"("masterReferralCode");
