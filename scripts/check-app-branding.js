#!/usr/bin/env node

/**
 * Check app branding data
 * Usage: node scripts/check-app-branding.js [appId]
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAppBranding(appId) {
  try {
    let app;
    
    if (appId) {
      app = await prisma.app.findUnique({
        where: { id: appId },
        select: {
          id: true,
          name: true,
          domain: true,
          description: true,
          logoUrl: true,
          primaryColor: true,
          waitlistLayout: true,
          hideGrowthKitBranding: true,
          waitlistEnabled: true,
          waitlistMessage: true,
        },
      });
      
      if (!app) {
        console.error(`❌ App not found with ID: ${appId}`);
        process.exit(1);
      }
      
      console.log('\n📱 App Branding Data:\n');
      console.log('ID:', app.id);
      console.log('Name:', app.name);
      console.log('Domain:', app.domain);
      console.log('\n🎨 Branding Fields:');
      console.log('  Description:', app.description || '❌ Not set');
      console.log('  Logo URL:', app.logoUrl || '❌ Not set');
      console.log('  Primary Color:', app.primaryColor || '❌ Not set');
      console.log('  Waitlist Layout:', app.waitlistLayout || 'centered (default)');
      console.log('  Hide GrowthKit Branding:', app.hideGrowthKitBranding);
      console.log('\n💬 Waitlist:');
      console.log('  Enabled:', app.waitlistEnabled);
      console.log('  Custom Message:', app.waitlistMessage || '❌ Not set');
      
      // Check if branding is complete
      const hasBranding = !!(app.description || app.logoUrl || app.primaryColor);
      console.log('\n' + (hasBranding ? '✅ App has branding configured' : '⚠️  App has no branding configured'));
      
    } else {
      // Show all apps
      const apps = await prisma.app.findMany({
        select: {
          id: true,
          name: true,
          domain: true,
          description: true,
          logoUrl: true,
          primaryColor: true,
          waitlistLayout: true,
          waitlistEnabled: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      
      if (apps.length === 0) {
        console.log('❌ No apps found');
        process.exit(0);
      }
      
      console.log(`\n📱 Found ${apps.length} app(s):\n`);
      
      apps.forEach((app, index) => {
        const hasBranding = !!(app.description || app.logoUrl || app.primaryColor);
        console.log(`${index + 1}. ${app.name} (${app.domain})`);
        console.log(`   ID: ${app.id}`);
        console.log(`   Branding: ${hasBranding ? '✅ Configured' : '⚠️  Not configured'}`);
        if (hasBranding) {
          if (app.description) console.log(`   • Description: "${app.description.substring(0, 50)}${app.description.length > 50 ? '...' : ''}"`);
          if (app.logoUrl) console.log(`   • Logo: ${app.logoUrl.substring(0, 60)}...`);
          if (app.primaryColor) console.log(`   • Color: ${app.primaryColor}`);
        }
        console.log('');
      });
      
      console.log('\n💡 To see details for a specific app, run:');
      console.log('   node scripts/check-app-branding.js <appId>\n');
    }
    
  } catch (error) {
    console.error('Error checking app branding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get appId from command line args
const appId = process.argv[2];

checkAppBranding(appId);

