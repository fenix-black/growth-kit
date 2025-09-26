-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "fingerprintId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "properties" JSONB,
    "context" JSONB NOT NULL,
    "sessionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activities_appId_timestamp_idx" ON "activities"("appId", "timestamp");

-- CreateIndex
CREATE INDEX "activities_fingerprintId_timestamp_idx" ON "activities"("fingerprintId", "timestamp");

-- CreateIndex
CREATE INDEX "activities_appId_eventName_idx" ON "activities"("appId", "eventName");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_fingerprintId_fkey" FOREIGN KEY ("fingerprintId") REFERENCES "fingerprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
