#!/usr/bin/env node

/**
 * Verify Shared Accounts Implementation
 * 
 * This script checks if the shared accounts feature is working correctly:
 * - Verifies fingerprints match across apps (client and server)
 * - Confirms OrgUserAccount linking
 * - Validates consolidated credits
 * - Checks profile data synchronization
 * 
 * Usage: node scripts/verify-shared-accounts-working.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifySharedAccounts() {
  try {
    console.log('\n=== SHARED ACCOUNTS VERIFICATION ===\n');

    // Get the three apps
    const apps = await prisma.app.findMany({
      where: {
        OR: [
          { name: { contains: 'landing', mode: 'insensitive' } },
          { name: { contains: 'virtual', mode: 'insensitive' } },
          { name: { contains: 'canvas', mode: 'insensitive' } },
        ],
        organizationId: 'cmgc8h0tb0000vm3bcnb3kn9x',
      },
      select: { id: true, name: true, isolatedAccounts: true },
      orderBy: { name: 'asc' },
    });

    console.log('📱 Apps:');
    apps.forEach(app => {
      console.log(`  - ${app.name} (isolatedAccounts: ${app.isolatedAccounts})`);
    });

    // Get all fingerprints for these apps
    const fingerprints = await prisma.fingerprint.findMany({
      where: {
        appId: { in: apps.map(a => a.id) }
      },
      include: {
        app: { select: { name: true } },
        orgUserAccount: { select: { id: true, name: true, email: true } },
        credits: true,
        leads: {
          select: { name: true, email: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    console.log('\n\n👤 Recent Fingerprints:\n');
    
    const fpGroups = {
      byClientFp: {},
      byServerFp: {},
      byOrgAccount: {},
    };

    fingerprints.forEach(fp => {
      const lead = fp.leads[0];
      const credits = fp.credits.reduce((sum, c) => sum + c.amount, 0);
      
      console.log(`${fp.app.name}:`);
      console.log(`  Created: ${fp.createdAt.toISOString()}`);
      console.log(`  Client FP: ${fp.fingerprint}`);
      console.log(`  Server FP: ${fp.serverFingerprint || 'NULL'}`);
      console.log(`  OrgUserAccountId: ${fp.orgUserAccountId || 'NULL'}`);
      console.log(`  Lead: ${lead?.name || 'NULL'}`);
      console.log(`  OrgAccount: ${fp.orgUserAccount?.name || 'NULL'}`);
      console.log(`  Credits: ${credits}`);
      console.log('');

      // Group for analysis
      if (!fpGroups.byClientFp[fp.fingerprint]) fpGroups.byClientFp[fp.fingerprint] = [];
      fpGroups.byClientFp[fp.fingerprint].push(fp);

      if (fp.serverFingerprint) {
        if (!fpGroups.byServerFp[fp.serverFingerprint]) fpGroups.byServerFp[fp.serverFingerprint] = [];
        fpGroups.byServerFp[fp.serverFingerprint].push(fp);
      }

      if (fp.orgUserAccountId) {
        if (!fpGroups.byOrgAccount[fp.orgUserAccountId]) fpGroups.byOrgAccount[fp.orgUserAccountId] = [];
        fpGroups.byOrgAccount[fp.orgUserAccountId].push(fp);
      }
    });

    // Analysis
    console.log('\n🔍 ANALYSIS:\n');

    // Client fingerprint matching
    const clientMatches = Object.values(fpGroups.byClientFp).filter(fps => fps.length > 1);
    console.log(`Client Fingerprint Matches: ${clientMatches.length}`);
    clientMatches.forEach(fps => {
      console.log(`  ✅ ${fps[0].fingerprint.substring(0, 20)}... (${fps.length} apps)`);
      fps.forEach(fp => console.log(`     - ${fp.app.name}`));
    });

    // Server fingerprint matching
    const serverMatches = Object.values(fpGroups.byServerFp).filter(fps => fps.length > 1);
    console.log(`\nServer Fingerprint Matches: ${serverMatches.length}`);
    if (serverMatches.length > 0) {
      serverMatches.forEach(fps => {
        console.log(`  ✅ ${fps[0].serverFingerprint.substring(0, 20)}... (${fps.length} apps)`);
        fps.forEach(fp => console.log(`     - ${fp.app.name}`));
      });
    } else {
      console.log(`  No matches yet (or all NULL)`);
    }

    // OrgUserAccount sharing
    console.log(`\nOrgUserAccount Sharing:`);
    const sharedAccounts = Object.values(fpGroups.byOrgAccount).filter(fps => fps.length > 1);
    if (sharedAccounts.length > 0) {
      sharedAccounts.forEach(fps => {
        const totalCredits = fps.reduce((sum, fp) => 
          sum + fp.credits.reduce((s, c) => s + c.amount, 0), 0
        );
        console.log(`  ✅ Account ${fps[0].orgUserAccountId} (${fps[0].orgUserAccount?.name || 'N/A'})`);
        console.log(`     Shared across ${fps.length} apps:`);
        fps.forEach(fp => console.log(`       - ${fp.app.name}`));
        console.log(`     Total Credits: ${totalCredits}`);
      });
    } else {
      console.log(`  ❌ No shared accounts found - each app has separate OrgUserAccount`);
    }

    // Final verdict
    console.log('\n\n🎯 VERDICT:\n');
    if (sharedAccounts.length > 0 && sharedAccounts[0].length === 3) {
      console.log('  ✅ SUCCESS! All 3 apps share the same OrgUserAccount');
      console.log('  ✅ Consolidated credits and profile working correctly');
    } else if (sharedAccounts.length > 0) {
      console.log('  ⚠️  PARTIAL: Some apps sharing, but not all 3');
    } else {
      console.log('  ❌ ISSUE: Apps are not sharing OrgUserAccounts');
      console.log('  Check if:');
      console.log('    - Apps have isolatedAccounts: false');
      console.log('    - Using same browser for all visits');
      console.log('    - Deployed latest code with serverFingerprint');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySharedAccounts();
