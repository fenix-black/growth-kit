#!/usr/bin/env node

/**
 * Test /me endpoint to see what app branding data is returned
 * Usage: node scripts/test-me-endpoint.js <appId>
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMeEndpoint(appId) {
  try {
    if (!appId) {
      console.error('❌ Please provide an appId');
      console.log('Usage: node scripts/test-me-endpoint.js <appId>');
      process.exit(1);
    }

    // Get app with API key
    const app = await prisma.app.findUnique({
      where: { id: appId },
      include: {
        apiKeys: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!app) {
      console.error(`❌ App not found: ${appId}`);
      process.exit(1);
    }

    console.log('\n📱 App Info:');
    console.log('Name:', app.name);
    console.log('Domain:', app.domain);
    console.log('\n🎨 Branding in Database:');
    console.log('Description:', app.description || '❌ Not set');
    console.log('Logo URL:', app.logoUrl || '❌ Not set');
    console.log('Primary Color:', app.primaryColor || '❌ Not set');
    console.log('Waitlist Layout:', app.waitlistLayout || 'centered');
    console.log('Hide GrowthKit Branding:', app.hideGrowthKitBranding);
    console.log('Waitlist Message:', app.waitlistMessage || '❌ Not set');

    if (!app.apiKeys || app.apiKeys.length === 0) {
      console.error('\n❌ No active API keys found for this app');
      process.exit(1);
    }

    // Get or create a test fingerprint
    let fingerprint = await prisma.fingerprint.findFirst({
      where: { appId: app.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!fingerprint) {
      console.log('\n📝 Creating test fingerprint...');
      fingerprint = await prisma.fingerprint.create({
        data: {
          appId: app.id,
          fingerprint: 'test-' + Date.now(),
        },
      });
    }

    console.log('\n🧪 Test Fingerprint:', fingerprint.fingerprint);

    // Make a mock API request to test what would be returned
    console.log('\n🔍 Simulating /me endpoint response:\n');
    
    // Get policy
    const policy = app.policyJson;

    // Get credits
    const credits = await prisma.credit.findMany({
      where: { fingerprintId: fingerprint.id },
    });
    const totalCredits = credits.reduce((sum, c) => sum + c.amount, 0);

    // Get waitlist status
    let waitlistData = null;
    if (app.waitlistEnabled) {
      const lead = await prisma.lead.findFirst({
        where: {
          appId: app.id,
          fingerprintId: fingerprint.id,
        },
      });

      if (lead?.email) {
        const waitlistEntry = await prisma.waitlist.findUnique({
          where: {
            appId_email: {
              appId: app.id,
              email: lead.email,
            },
          },
        });

        if (waitlistEntry) {
          waitlistData = {
            enabled: true,
            status: waitlistEntry.status.toLowerCase(),
            position: waitlistEntry.position,
            message: app.waitlistMessage,
            requiresWaitlist: true,
          };
        }
      } else {
        waitlistData = {
          enabled: true,
          status: 'none',
          position: null,
          message: app.waitlistMessage,
          requiresWaitlist: true,
        };
      }
    }

    // Simulate the response
    const mockResponse = {
      fingerprint: fingerprint.fingerprint,
      referralCode: fingerprint.referralCode,
      credits: totalCredits,
      usage: 0,
      creditsPaused: app.creditsPaused,
      policy: policy,
      name: null,
      email: null,
      hasClaimedName: false,
      hasClaimedEmail: false,
      hasVerifiedEmail: false,
      app: {
        name: app.name,
        description: app.description,
        logoUrl: app.logoUrl,
        primaryColor: app.primaryColor,
        waitlistLayout: app.waitlistLayout,
        hideGrowthKitBranding: app.hideGrowthKitBranding,
      },
      waitlist: waitlistData,
    };

    console.log(JSON.stringify(mockResponse, null, 2));

    console.log('\n✅ This is what the /me endpoint should return');
    console.log('\n💡 Check if the SDK is receiving this "app" object in the response');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const appId = process.argv[2];
testMeEndpoint(appId);

