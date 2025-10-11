#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simulateNameClaim() {
  try {
    console.log('\n=== SIMULATING NAME CLAIM UPDATE ===\n');

    // Get Landing Page fingerprint
    const fingerprint = await prisma.fingerprint.findFirst({
      where: {
        app: {
          name: { contains: 'landing', mode: 'insensitive' }
        }
      },
      include: {
        app: {
          select: { id: true, name: true, isolatedAccounts: true, organizationId: true }
        }
      }
    });

    if (!fingerprint) {
      console.log('❌ No fingerprint found');
      return;
    }

    console.log('📊 Current State:');
    console.log(`  App: ${fingerprint.app.name}`);
    console.log(`  isolatedAccounts: ${fingerprint.app.isolatedAccounts}`);
    console.log(`  organizationId: ${fingerprint.app.organizationId}`);
    console.log(`  fingerprintorgUserAccountId: ${fingerprint.orgUserAccountId || 'NULL'}`);

    // Check the condition
    const shouldUpdate = !fingerprint.app.isolatedAccounts && fingerprint.orgUserAccountId;
    console.log(`\n🧪 Condition Check:`);
    console.log(`  !app.isolatedAccounts: ${!fingerprint.app.isolatedAccounts}`);
    console.log(`  fingerprint.orgUserAccountId: ${!!fingerprint.orgUserAccountId}`);
    console.log(`  → Should update: ${shouldUpdate ? '✅ YES' : '❌ NO'}`);

    if (!shouldUpdate) {
      console.log('\n❌ Condition would NOT trigger OrgUserAccount update!');
      if (fingerprint.app.isolatedAccounts) {
        console.log('   Reason: app.isolatedAccounts is TRUE (should be false)');
      }
      if (!fingerprint.orgUserAccountId) {
        console.log('   Reason: fingerprint.orgUserAccountId is NULL (fingerprint not linked)');
      }
      return;
    }

    // Simulate the update
    console.log(`\n✅ Condition passes! Would update OrgUserAccount ${fingerprint.orgUserAccountId}`);
    console.log(`   Setting name to: "Test Name"`);

    const updatedAccount = await prisma.orgUserAccount.update({
      where: { id: fingerprint.orgUserAccountId },
      data: { name: 'Test Name', updatedAt: new Date() },
    });

    console.log(`\n✅ Update successful!`);
    console.log(`   OrgUserAccount name: ${updatedAccount.name}`);
    console.log(`   Updated at: ${updatedAccount.updatedAt.toISOString()}`);

    // Check if other fingerprint would now see this
    const allFingerprints = await prisma.fingerprint.findMany({
      where: {
        orgUserAccountId: fingerprint.orgUserAccountId
      },
      include: {
        app: { select: { name: true } }
      }
    });

    console.log(`\n📋 Fingerprints linked to this OrgUserAccount:`);
    allFingerprints.forEach(fp => {
      console.log(`   - ${fp.app.name}: Would now show "Test Name"`);
    });

  } catch (error) {
    console.error('\n❌ ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateNameClaim();
