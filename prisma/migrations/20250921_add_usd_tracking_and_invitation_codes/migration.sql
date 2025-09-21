-- AlterTable
ALTER TABLE "public"."apps" ADD COLUMN     "trackUsdValue" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."usage" ADD COLUMN     "usdValue" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."waitlist" ADD COLUMN     "codeExpiresAt" TIMESTAMP(3),
ADD COLUMN     "codeUsedAt" TIMESTAMP(3),
ADD COLUMN     "fingerprintId" TEXT,
ADD COLUMN     "invitationCode" TEXT,
ADD COLUMN     "maxUses" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "useCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "usage_usdValue_idx" ON "public"."usage"("usdValue");

-- CreateIndex
CREATE INDEX "waitlist_invitationCode_idx" ON "public"."waitlist"("invitationCode");

-- CreateIndex
CREATE INDEX "waitlist_fingerprintId_idx" ON "public"."waitlist"("fingerprintId");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_appId_invitationCode_key" ON "public"."waitlist"("appId", "invitationCode");
