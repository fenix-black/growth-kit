-- Add metadata field to App model for product waitlists configuration
ALTER TABLE "apps" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- Add productTag field to Waitlist model for product-specific waitlists
ALTER TABLE "waitlist" ADD COLUMN IF NOT EXISTS "productTag" TEXT;

-- Drop the old unique constraint on (appId, email)
ALTER TABLE "waitlist" DROP CONSTRAINT IF EXISTS "waitlist_appId_email_key";

-- Add new unique constraint on (appId, email, productTag)
-- This allows the same email to join both app-level (productTag=null) and product-specific waitlists
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_appId_email_productTag_key" UNIQUE ("appId", "email", "productTag");

-- Add index on (appId, productTag) for efficient product filtering
CREATE INDEX IF NOT EXISTS "waitlist_appId_productTag_idx" ON "waitlist"("appId", "productTag");

-- Set existing waitlist entries to have null productTag (app-level waitlists)
UPDATE "waitlist" SET "productTag" = NULL WHERE "productTag" IS NULL;

