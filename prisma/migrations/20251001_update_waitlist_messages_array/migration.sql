-- Migration: Update waitlist message to messages array
-- This migration converts the single waitlistMessage field to waitlistMessages array

-- Step 1: Add new waitlistMessages array column with default empty array
ALTER TABLE "apps" ADD COLUMN "waitlistMessages" TEXT[] DEFAULT '{}';

-- Step 2: Migrate existing waitlistMessage data to waitlistMessages array
-- If waitlistMessage exists and is not null, add it to the array
UPDATE "apps"
SET "waitlistMessages" = ARRAY[COALESCE("waitlistMessage", '')]::TEXT[]
WHERE "waitlistMessage" IS NOT NULL AND "waitlistMessage" != '';

-- Step 3: Drop the old waitlistMessage column
ALTER TABLE "apps" DROP COLUMN IF EXISTS "waitlistMessage";

