#!/usr/bin/env node

/**
 * Reset Database Script
 * 
 * Clears user and waitlist data while preserving apps and configuration.
 * 
 * Usage:
 *   node scripts/reset-database.js                    # Default: reset users and waitlist
 *   node scripts/reset-database.js --all             # Full reset including event logs
 *   node scripts/reset-database.js --dry-run         # Preview what would be deleted
 *   node scripts/reset-database.js --app-id "xxx"    # Reset only for specific app
 *   node scripts/reset-database.js --keep-events     # Keep event logs
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const fullReset = args.includes('--all');
const keepEvents = args.includes('--keep-events');
const appIdIndex = args.indexOf('--app-id');
const specificAppId = appIdIndex !== -1 ? args[appIdIndex + 1] : null;

async function getRecordCounts(appId = null) {
  const whereClause = appId ? { appId } : {};
  const fingerprintWhereClause = appId ? { appId } : {};
  
  const counts = {
    fingerprints: await prisma.fingerprint.count({ where: fingerprintWhereClause }),
    waitlist: await prisma.waitlist.count({ where: whereClause }),
    leads: await prisma.lead.count({ where: whereClause }),
    referrals: await prisma.referral.count({ where: whereClause }),
    credits: await prisma.credit.count(),
    usage: await prisma.usage.count(),
    activities: await prisma.activity.count({ where: whereClause }),
    eventLogs: await prisma.eventLog.count({ where: whereClause }),
    apps: await prisma.app.count(),
    apiKeys: await prisma.apiKey.count(),
  };
  
  return counts;
}

async function resetDatabase() {
  console.log('🚀 Database Reset Script');
  console.log('========================\n');
  
  // Display current options
  console.log('Options:');
  console.log(`  Dry Run: ${dryRun ? 'YES (preview only)' : 'NO (will delete data)'}`);
  console.log(`  Full Reset: ${fullReset ? 'YES' : 'NO'}`);
  console.log(`  Keep Event Logs: ${keepEvents ? 'YES' : 'NO'}`);
  console.log(`  Specific App: ${specificAppId || 'ALL APPS'}`);
  console.log('');
  
  try {
    // Get initial counts
    console.log('📊 Current Database Status:');
    console.log('---------------------------');
    const beforeCounts = await getRecordCounts(specificAppId);
    
    console.log(`  Apps: ${beforeCounts.apps} (will be preserved)`);
    console.log(`  API Keys: ${beforeCounts.apiKeys} (will be preserved)`);
    console.log(`  Fingerprints: ${beforeCounts.fingerprints}`);
    console.log(`  Waitlist Entries: ${beforeCounts.waitlist}`);
    console.log(`  Leads: ${beforeCounts.leads}`);
    console.log(`  Referrals: ${beforeCounts.referrals}`);
    console.log(`  Credits: ${beforeCounts.credits}`);
    console.log(`  Usage Records: ${beforeCounts.usage}`);
    console.log(`  Activities: ${beforeCounts.activities}`);
    console.log(`  Event Logs: ${beforeCounts.eventLogs}`);
    console.log('');
    
    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No data will be deleted\n');
      console.log('The following would be deleted:');
      console.log(`  - ${beforeCounts.fingerprints} fingerprints`);
      console.log(`  - ${beforeCounts.waitlist} waitlist entries`);
      console.log(`  - ${beforeCounts.leads} leads`);
      console.log(`  - ${beforeCounts.referrals} referrals`);
      console.log(`  - ${beforeCounts.credits} credits`);
      console.log(`  - ${beforeCounts.usage} usage records`);
      console.log(`  - ${beforeCounts.activities} activities`);
      if (!keepEvents) {
        console.log(`  - ${beforeCounts.eventLogs} event logs`);
      }
      console.log('\nTo perform the actual reset, run without --dry-run flag');
      return;
    }
    
    // Confirm before proceeding
    if (!dryRun && beforeCounts.fingerprints + beforeCounts.waitlist + beforeCounts.leads > 0) {
      console.log('⚠️  WARNING: This will permanently delete user data!');
      console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    console.log('🔄 Starting database reset...\n');
    
    // Build where clause for app-specific deletion
    const whereClause = specificAppId ? { appId: specificAppId } : {};
    const fingerprintWhereClause = specificAppId ? { appId: specificAppId } : {};
    
    // Delete in order to respect foreign key constraints
    
    // 1. Delete Activities (depends on Fingerprint)
    const activitiesResult = await prisma.activity.deleteMany({
      where: whereClause
    });
    console.log(`✓ Deleted ${activitiesResult.count} activities`);
    
    // 2. Delete Credits and Usage (depends on Fingerprint)
    if (specificAppId) {
      // For app-specific reset, we need to find fingerprints first
      const fingerprints = await prisma.fingerprint.findMany({
        where: fingerprintWhereClause,
        select: { id: true }
      });
      const fingerprintIds = fingerprints.map(f => f.id);
      
      if (fingerprintIds.length > 0) {
        const result = await prisma.credit.deleteMany({
          where: { fingerprintId: { in: fingerprintIds } }
        });
        console.log(`✓ Deleted ${result.count} credits`);
        
        const usageResult = await prisma.usage.deleteMany({
          where: { fingerprintId: { in: fingerprintIds } }
        });
        console.log(`✓ Deleted ${usageResult.count} usage records`);
      }
    } else {
      // Delete all credits and usage
      const creditResult = await prisma.credit.deleteMany({});
      console.log(`✓ Deleted ${creditResult.count} credits`);
      
      const usageResult = await prisma.usage.deleteMany({});
      console.log(`✓ Deleted ${usageResult.count} usage records`);
    }
    
    // 3. Delete Referrals
    const referralResult = await prisma.referral.deleteMany({
      where: whereClause
    });
    console.log(`✓ Deleted ${referralResult.count} referrals`);
    
    // 4. Delete Leads
    const leadResult = await prisma.lead.deleteMany({
      where: whereClause
    });
    console.log(`✓ Deleted ${leadResult.count} leads`);
    
    // 5. Delete Waitlist entries
    const waitlistResult = await prisma.waitlist.deleteMany({
      where: whereClause
    });
    console.log(`✓ Deleted ${waitlistResult.count} waitlist entries`);
    
    // 6. Delete Fingerprints (this will cascade delete related records if any remain)
    const fingerprintResult = await prisma.fingerprint.deleteMany({
      where: fingerprintWhereClause
    });
    console.log(`✓ Deleted ${fingerprintResult.count} fingerprints`);
    
    // 7. Optionally delete Event Logs
    if (!keepEvents) {
      const eventResult = await prisma.eventLog.deleteMany({
        where: whereClause
      });
      console.log(`✓ Deleted ${eventResult.count} event logs`);
    } else {
      console.log(`✓ Kept ${beforeCounts.eventLogs} event logs`);
    }
    
    // Get final counts
    console.log('\n📊 Final Database Status:');
    console.log('-------------------------');
    const afterCounts = await getRecordCounts();
    
    console.log(`  Apps: ${afterCounts.apps} ✅`);
    console.log(`  API Keys: ${afterCounts.apiKeys} ✅`);
    console.log(`  Fingerprints: ${afterCounts.fingerprints}`);
    console.log(`  Waitlist Entries: ${afterCounts.waitlist}`);
    console.log(`  Leads: ${afterCounts.leads}`);
    console.log(`  Referrals: ${afterCounts.referrals}`);
    console.log(`  Credits: ${afterCounts.credits}`);
    console.log(`  Usage Records: ${afterCounts.usage}`);
    console.log(`  Activities: ${afterCounts.activities}`);
    if (keepEvents) {
      console.log(`  Event Logs: ${afterCounts.eventLogs} (preserved)`);
    } else {
      console.log(`  Event Logs: ${afterCounts.eventLogs}`);
    }
    
    console.log('\n✅ Database reset completed successfully!');
    console.log('   Apps and API keys have been preserved.');
    
  } catch (error) {
    console.error('\n❌ Error resetting database:', error);
    console.error('\nDetails:', error.message);
    if (error.code === 'P2003') {
      console.error('\nForeign key constraint violation. Some records may have dependencies.');
      console.error('Try running the script again or check for data integrity issues.');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Add help text
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Database Reset Script
=====================

This script resets user and waitlist data while preserving apps and configuration.

Usage:
  node scripts/reset-database.js [options]

Options:
  --dry-run         Preview what would be deleted without actually deleting
  --all             Full reset including all data
  --keep-events     Preserve event logs (useful for audit/analytics)
  --app-id <id>     Reset data only for a specific app
  --help, -h        Show this help message

Examples:
  node scripts/reset-database.js --dry-run
    Preview what would be deleted

  node scripts/reset-database.js
    Reset all user and waitlist data for all apps

  node scripts/reset-database.js --keep-events
    Reset users/waitlist but keep event logs

  node scripts/reset-database.js --app-id "clxxx..."
    Reset data only for a specific app

Safety:
  - Apps and API keys are always preserved
  - A 5-second delay is added before deletion for safety
  - Use --dry-run first to preview changes
  `);
  process.exit(0);
}

// Run the reset
resetDatabase();
