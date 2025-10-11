#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugApiLogic() {
  try {
    console.log('🔍 Debugging API Logic Directly...\n');

    // Get the landing page app
    const app = await prisma.app.findFirst({
      where: {
        name: { contains: 'landing', mode: 'insensitive' }
      }
    });

    if (!app) {
      console.log('❌ No landing app found');
      return;
    }

    console.log(`📱 App: ${app.name}`);
    console.log(`   Current isolatedAccounts: ${app.isolatedAccounts}\n`);

    // Simulate the exact logic from the PUT endpoint
    console.log('🧪 Simulating API logic...');

    // This is what the API receives
    const body = {
      id: app.id,
      isolatedAccounts: false, // This is what we're trying to save
      // Include other required fields to avoid breaking the update
      waitlistEnabled: app.waitlistEnabled,
      trackUsdValue: app.trackUsdValue,
      allowCustomCredits: app.allowCustomCredits,
      maxCustomCredits: app.maxCustomCredits,
      initialCreditsPerDay: app.initialCreditsPerDay,
      creditsPaused: app.creditsPaused,
    };

    console.log('📤 Body isolatedAccounts:', body.isolatedAccounts);

    // Simulate the updateData building logic
    const updateData = {};
    
    // Copy the exact logic from the API
    if (body.waitlistEnabled !== undefined) updateData.waitlistEnabled = body.waitlistEnabled;
    if (body.trackUsdValue !== undefined) updateData.trackUsdValue = body.trackUsdValue; 
    if (body.allowCustomCredits !== undefined) updateData.allowCustomCredits = body.allowCustomCredits;
    if (body.maxCustomCredits !== undefined) updateData.maxCustomCredits = body.maxCustomCredits;
    if (body.initialCreditsPerDay !== undefined) updateData.initialCreditsPerDay = body.initialCreditsPerDay;
    if (body.creditsPaused !== undefined) updateData.creditsPaused = body.creditsPaused;
    if (body.isolatedAccounts !== undefined) updateData.isolatedAccounts = body.isolatedAccounts;

    console.log('📋 updateData object:');
    console.log('   isolatedAccounts in updateData:', updateData.isolatedAccounts);
    console.log('   updateData keys:', Object.keys(updateData));

    // Now try the actual database update
    console.log('\n🔄 Attempting database update...');
    
    const updatedApp = await prisma.app.update({
      where: { id: app.id },
      data: updateData,
    });

    console.log('✅ Update completed!');
    console.log('   New isolatedAccounts value:', updatedApp.isolatedAccounts);

    // Verify by re-fetching
    const verifyApp = await prisma.app.findUnique({
      where: { id: app.id },
      select: { isolatedAccounts: true }
    });

    console.log('🔍 Verification fetch:');
    console.log('   isolatedAccounts:', verifyApp.isolatedAccounts);

    if (verifyApp.isolatedAccounts === false) {
      console.log('\n🎉 SUCCESS! The API logic works correctly');
      
      // Revert for next test
      await prisma.app.update({
        where: { id: app.id },
        data: { isolatedAccounts: true }
      });
      console.log('🔄 Reverted back to original state');
      
    } else {
      console.log('\n❌ FAILED! Something is wrong with the API logic');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugApiLogic();
