-- Add browser, device, and location tracking fields to fingerprints
ALTER TABLE "fingerprints" ADD COLUMN "browser" TEXT;
ALTER TABLE "fingerprints" ADD COLUMN "device" TEXT;
ALTER TABLE "fingerprints" ADD COLUMN "location" JSONB;
