-- CreateTable
CREATE TABLE "admin_activities" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_activities_action_idx" ON "admin_activities"("action");

-- CreateIndex
CREATE INDEX "admin_activities_targetType_targetId_idx" ON "admin_activities"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "admin_activities_timestamp_idx" ON "admin_activities"("timestamp");
