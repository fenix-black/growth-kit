#!/usr/bin/env node

/**
 * Reset User Script
 * 
 * Usage:
 *   node scripts/reset-user.js --fingerprint "5291764462133909"
 *   node scripts/reset-user.js --email "test@example.com" --app-id "your-app-id"
 *   node scripts/reset-user.js --fingerprint "5291764462133909" --full  # Full reset including credits
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetUser() {
  const args = process.argv.slice(2);
  const fingerprintIndex = args.indexOf('--fingerprint');
  const emailIndex = args.indexOf('--email');
  const appIdIndex = args.indexOf('--app-id');
  const fullReset = args.includes('--full');
  
  const fingerprint = fingerprintIndex !== -1 ? args[fingerprintIndex + 1] : null;
  const email = emailIndex !== -1 ? args[emailIndex + 1] : null;
  const appId = appIdIndex !== -1 ? args[appIdIndex + 1] : null;
  
  if (!fingerprint && !email) {
    console.error('❌ Please provide either --fingerprint or --email');
    console.log('\nUsage:');
    console.log('  node scripts/reset-user.js --fingerprint "5291764462133909"');
    console.log('  node scripts/reset-user.js --email "test@example.com" --app-id "your-app-id"');
    console.log('  node scripts/reset-user.js --fingerprint "5291764462133909" --full');
    process.exit(1);
  }
  
  try {
    console.log('🔄 Starting user reset...');
    
    if (fingerprint) {
      // Find the fingerprint record
      const fingerprintRecord = await prisma.fingerprint.findFirst({
        where: { fingerprint },
        include: { leads: true }
      });
      
      if (!fingerprintRecord) {
        console.error(`❌ Fingerprint not found: ${fingerprint}`);
        process.exit(1);
      }
      
      console.log(`✓ Found fingerprint: ${fingerprintRecord.id}`);
      const appId = fingerprintRecord.appId;
      
      // Reset waitlist entries for all associated emails
      for (const lead of fingerprintRecord.leads) {
        if (lead.email) {
          const waitlistEntry = await prisma.waitlist.findUnique({
            where: {
              appId_email: {
                appId: appId,
                email: lead.email
              }
            }
          });
          
          if (waitlistEntry) {
            // Delete the waitlist entry to reset completely
            await prisma.waitlist.delete({
              where: { id: waitlistEntry.id }
            });
            console.log(`✓ Reset waitlist for email: ${lead.email}`);
          }
        }
      }
      
      if (fullReset) {
        // Delete all credits
        await prisma.credit.deleteMany({
          where: { fingerprintId: fingerprintRecord.id }
        });
        console.log('✓ Deleted all credits');
        
        // Delete all usage records
        await prisma.usage.deleteMany({
          where: { fingerprintId: fingerprintRecord.id }
        });
        console.log('✓ Deleted all usage records');
        
        // Delete all leads
        await prisma.lead.deleteMany({
          where: { fingerprintId: fingerprintRecord.id }
        });
        console.log('✓ Deleted all lead records');
        
        // Reset daily grant timestamp
        await prisma.fingerprint.update({
          where: { id: fingerprintRecord.id },
          data: { 
            lastDailyGrant: null,
            lastActiveAt: null 
          }
        });
        console.log('✓ Reset daily grant timestamp');
      }
      
      console.log(`✅ Successfully reset user with fingerprint: ${fingerprint}`);
      
    } else if (email && appId) {
      // Reset by email
      const normalizedEmail = email.toLowerCase().trim();
      
      // Find and delete waitlist entry
      const waitlistEntry = await prisma.waitlist.findUnique({
        where: {
          appId_email: {
            appId: appId,
            email: normalizedEmail
          }
        }
      });
      
      if (waitlistEntry) {
        await prisma.waitlist.delete({
          where: { id: waitlistEntry.id }
        });
        console.log(`✓ Reset waitlist for email: ${normalizedEmail}`);
      }
      
      // Optionally reset lead record
      if (fullReset) {
        await prisma.lead.deleteMany({
          where: {
            appId: appId,
            email: normalizedEmail
          }
        });
        console.log('✓ Deleted lead record');
      }
      
      console.log(`✅ Successfully reset user with email: ${email}`);
    }
    
  } catch (error) {
    console.error('❌ Error resetting user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
resetUser();
