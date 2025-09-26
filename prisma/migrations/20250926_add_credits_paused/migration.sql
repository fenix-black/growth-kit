-- Add creditsPaused fields to apps table
ALTER TABLE "apps" ADD COLUMN "creditsPaused" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "apps" ADD COLUMN "creditsPausedAt" TIMESTAMP(3);
