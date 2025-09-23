-- Add daily credit configuration to apps table
ALTER TABLE "apps" ADD COLUMN IF NOT EXISTS "initial_credits_per_day" INTEGER DEFAULT 3;
ALTER TABLE "apps" ADD COLUMN IF NOT EXISTS "credits_for_name" INTEGER DEFAULT 1;
ALTER TABLE "apps" ADD COLUMN IF NOT EXISTS "credits_for_email" INTEGER DEFAULT 1;
ALTER TABLE "apps" ADD COLUMN IF NOT EXISTS "credits_for_email_verification" INTEGER DEFAULT 1;
ALTER TABLE "apps" ADD COLUMN IF NOT EXISTS "max_credit_balance" INTEGER;

-- Add daily grant tracking to fingerprints table
ALTER TABLE "fingerprints" ADD COLUMN IF NOT EXISTS "last_daily_grant" TIMESTAMP(3);
ALTER TABLE "fingerprints" ADD COLUMN IF NOT EXISTS "last_active_at" TIMESTAMP(3);
