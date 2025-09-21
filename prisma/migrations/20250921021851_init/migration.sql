-- CreateTable
CREATE TABLE "public"."tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."apps" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "corsOrigins" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "redirectUrl" TEXT NOT NULL,
    "policyJson" JSONB NOT NULL,
    "emailTemplates" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_keys" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "keyHint" TEXT NOT NULL,
    "hashedKey" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'full',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fingerprints" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "referralCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fingerprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."credits" (
    "id" TEXT NOT NULL,
    "fingerprintId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."usage" (
    "id" TEXT NOT NULL,
    "fingerprintId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."referrals" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT,
    "claimToken" TEXT,
    "claimExpiresAt" TIMESTAMP(3),
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    "lastVisitAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."leads" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "fingerprintId" TEXT,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifyToken" TEXT,
    "verifyExpiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."waitlist" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "position" INTEGER,
    "invitedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_logs" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_domain_key" ON "public"."tenants"("domain");

-- CreateIndex
CREATE INDEX "apps_tenantId_idx" ON "public"."apps"("tenantId");

-- CreateIndex
CREATE INDEX "apps_domain_idx" ON "public"."apps"("domain");

-- CreateIndex
CREATE INDEX "api_keys_appId_idx" ON "public"."api_keys"("appId");

-- CreateIndex
CREATE INDEX "api_keys_keyHint_idx" ON "public"."api_keys"("keyHint");

-- CreateIndex
CREATE UNIQUE INDEX "fingerprints_referralCode_key" ON "public"."fingerprints"("referralCode");

-- CreateIndex
CREATE INDEX "fingerprints_appId_idx" ON "public"."fingerprints"("appId");

-- CreateIndex
CREATE INDEX "fingerprints_fingerprint_idx" ON "public"."fingerprints"("fingerprint");

-- CreateIndex
CREATE INDEX "fingerprints_referralCode_idx" ON "public"."fingerprints"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "fingerprints_appId_fingerprint_key" ON "public"."fingerprints"("appId", "fingerprint");

-- CreateIndex
CREATE INDEX "credits_fingerprintId_idx" ON "public"."credits"("fingerprintId");

-- CreateIndex
CREATE INDEX "credits_reason_idx" ON "public"."credits"("reason");

-- CreateIndex
CREATE INDEX "credits_createdAt_idx" ON "public"."credits"("createdAt");

-- CreateIndex
CREATE INDEX "usage_fingerprintId_idx" ON "public"."usage"("fingerprintId");

-- CreateIndex
CREATE INDEX "usage_action_idx" ON "public"."usage"("action");

-- CreateIndex
CREATE INDEX "usage_createdAt_idx" ON "public"."usage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_referredId_key" ON "public"."referrals"("referredId");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_claimToken_key" ON "public"."referrals"("claimToken");

-- CreateIndex
CREATE INDEX "referrals_appId_idx" ON "public"."referrals"("appId");

-- CreateIndex
CREATE INDEX "referrals_referrerId_idx" ON "public"."referrals"("referrerId");

-- CreateIndex
CREATE INDEX "referrals_referredId_idx" ON "public"."referrals"("referredId");

-- CreateIndex
CREATE INDEX "referrals_claimToken_idx" ON "public"."referrals"("claimToken");

-- CreateIndex
CREATE UNIQUE INDEX "leads_verifyToken_key" ON "public"."leads"("verifyToken");

-- CreateIndex
CREATE INDEX "leads_appId_idx" ON "public"."leads"("appId");

-- CreateIndex
CREATE INDEX "leads_fingerprintId_idx" ON "public"."leads"("fingerprintId");

-- CreateIndex
CREATE INDEX "leads_email_idx" ON "public"."leads"("email");

-- CreateIndex
CREATE INDEX "leads_verifyToken_idx" ON "public"."leads"("verifyToken");

-- CreateIndex
CREATE UNIQUE INDEX "leads_appId_email_key" ON "public"."leads"("appId", "email");

-- CreateIndex
CREATE INDEX "waitlist_appId_idx" ON "public"."waitlist"("appId");

-- CreateIndex
CREATE INDEX "waitlist_status_idx" ON "public"."waitlist"("status");

-- CreateIndex
CREATE INDEX "waitlist_position_idx" ON "public"."waitlist"("position");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_appId_email_key" ON "public"."waitlist"("appId", "email");

-- CreateIndex
CREATE INDEX "event_logs_appId_idx" ON "public"."event_logs"("appId");

-- CreateIndex
CREATE INDEX "event_logs_event_idx" ON "public"."event_logs"("event");

-- CreateIndex
CREATE INDEX "event_logs_entityType_entityId_idx" ON "public"."event_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "event_logs_createdAt_idx" ON "public"."event_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."apps" ADD CONSTRAINT "apps_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_keys" ADD CONSTRAINT "api_keys_appId_fkey" FOREIGN KEY ("appId") REFERENCES "public"."apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fingerprints" ADD CONSTRAINT "fingerprints_appId_fkey" FOREIGN KEY ("appId") REFERENCES "public"."apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credits" ADD CONSTRAINT "credits_fingerprintId_fkey" FOREIGN KEY ("fingerprintId") REFERENCES "public"."fingerprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usage" ADD CONSTRAINT "usage_fingerprintId_fkey" FOREIGN KEY ("fingerprintId") REFERENCES "public"."fingerprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referrals" ADD CONSTRAINT "referrals_appId_fkey" FOREIGN KEY ("appId") REFERENCES "public"."apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referrals" ADD CONSTRAINT "referrals_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "public"."fingerprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referrals" ADD CONSTRAINT "referrals_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "public"."fingerprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_appId_fkey" FOREIGN KEY ("appId") REFERENCES "public"."apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_fingerprintId_fkey" FOREIGN KEY ("fingerprintId") REFERENCES "public"."fingerprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."waitlist" ADD CONSTRAINT "waitlist_appId_fkey" FOREIGN KEY ("appId") REFERENCES "public"."apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_logs" ADD CONSTRAINT "event_logs_appId_fkey" FOREIGN KEY ("appId") REFERENCES "public"."apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
