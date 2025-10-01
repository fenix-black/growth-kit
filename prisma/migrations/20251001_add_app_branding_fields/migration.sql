-- AlterTable
ALTER TABLE "apps" ADD COLUMN "waitlistLayout" TEXT NOT NULL DEFAULT 'centered',
ADD COLUMN "description" TEXT,
ADD COLUMN "logoUrl" TEXT,
ADD COLUMN "primaryColor" TEXT,
ADD COLUMN "hideGrowthKitBranding" BOOLEAN NOT NULL DEFAULT false;

