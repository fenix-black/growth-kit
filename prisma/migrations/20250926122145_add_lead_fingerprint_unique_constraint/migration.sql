-- CreateIndex
CREATE UNIQUE INDEX "leads_appId_fingerprintId_key" ON "leads"("appId", "fingerprintId");
