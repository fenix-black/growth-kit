const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedCronEvents() {
  try {
    // Get all apps
    const apps = await prisma.app.findMany({
      where: { isActive: true },
      take: 3,
    });

    if (apps.length === 0) {
      console.log('No apps found. Please create an app first.');
      return;
    }

    console.log(`Found ${apps.length} apps. Creating cron execution events...`);

    // Create cron events for the past 7 days
    const events = [];
    const now = new Date();
    
    for (let daysAgo = 0; daysAgo < 7; daysAgo++) {
      for (const app of apps) {
        const executionDate = new Date(now);
        executionDate.setDate(executionDate.getDate() - daysAgo);
        executionDate.setHours(9, 0, 0, 0); // Set to 9 AM
        
        // Randomly determine success, partial, or failed
        const random = Math.random();
        let status, invitedCount, errors, totalProcessed;
        
        if (random > 0.8) {
          // Failed (20% chance) - SIMULATED ERROR FOR TESTING
          status = 'failed';
          invitedCount = 0;
          totalProcessed = 0;
          errors = ['[TEST DATA] Simulated database connection timeout for demo purposes'];
        } else if (random > 0.6) {
          // Partial success (20% chance) - SIMULATED PARTIAL FAILURE
          status = 'partial';
          invitedCount = Math.floor(Math.random() * 8) + 2;
          totalProcessed = invitedCount + 2;
          errors = ['[TEST DATA] Simulated email failure for test1@example.com', '[TEST DATA] Simulated email failure for test2@example.com'];
        } else {
          // Success (60% chance)
          status = 'success';
          invitedCount = Math.floor(Math.random() * 10) + 5;
          totalProcessed = invitedCount;
          errors = [];
        }
        
        const duration = Math.floor(Math.random() * 5000) + 1000;
        
        events.push({
          appId: app.id,
          event: 'cron.invite_waitlist',
          entityType: 'cron',
          metadata: {
            appName: app.name,
            invitedCount,
            totalProcessed,
            errors,
            dailyQuota: 10,
            duration,
            status,
          },
          createdAt: executionDate,
        });
      }
    }

    // Insert all events
    const result = await prisma.eventLog.createMany({
      data: events,
    });

    console.log(`✅ Successfully created ${result.count} cron execution events!`);
    console.log('You can now view these in the Cron Job Monitor at /admin/cron');
    
  } catch (error) {
    console.error('Error seeding cron events:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCronEvents();
