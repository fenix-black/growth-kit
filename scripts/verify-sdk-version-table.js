#!/usr/bin/env node
/**
 * Verify SDK Version Usage table
 * Quick test to ensure the table exists and can be written to
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying sdk_version_usage table...\n');

  try {
    // Check if we can query the table
    const count = await prisma.sdkVersionUsage.count();
    console.log(`✅ Table exists! Current records: ${count}`);

    // Get first app and fingerprint for testing
    const app = await prisma.app.findFirst();
    const fingerprint = await prisma.fingerprint.findFirst({
      where: { appId: app?.id }
    });

    if (!app || !fingerprint) {
      console.log('⚠️  No app or fingerprint found for test insertion');
      return;
    }

    // Test insertion
    console.log('\n🧪 Testing record insertion...');
    const testRecord = await prisma.sdkVersionUsage.create({
      data: {
        fingerprintId: fingerprint.id,
        appId: app.id,
        sdkVersion: '0.8.0+test.verification',
        loadSource: 'test',
        bundleSize: 323000,
        loadTime: 150,
      }
    });

    console.log('✅ Test record created:', {
      id: testRecord.id,
      sdkVersion: testRecord.sdkVersion,
      loadSource: testRecord.loadSource,
      createdAt: testRecord.createdAt,
    });

    // Query it back
    const retrieved = await prisma.sdkVersionUsage.findUnique({
      where: { id: testRecord.id },
      include: {
        app: { select: { name: true } },
        fingerprint: { select: { fingerprint: true } }
      }
    });

    console.log('\n✅ Record retrieved with relations:', {
      id: retrieved.id,
      appName: retrieved.app.name,
      fingerprintPreview: retrieved.fingerprint.fingerprint.substring(0, 10) + '...',
    });

    // Clean up test record
    await prisma.sdkVersionUsage.delete({
      where: { id: testRecord.id }
    });

    console.log('\n✅ Test record cleaned up');
    console.log('\n🎉 SDK Version Usage table is working correctly!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

