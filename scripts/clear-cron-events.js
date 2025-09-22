const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearCronEvents() {
  try {
    // Delete all cron.invite_waitlist events
    const result = await prisma.eventLog.deleteMany({
      where: {
        event: 'cron.invite_waitlist',
      },
    });

    console.log(`✅ Deleted ${result.count} cron execution events from the database.`);
    console.log('The Cron Job Monitor will now show an empty state.');
    console.log('You can run a real cron job or use seed-cron-events.js to add test data.');
    
  } catch (error) {
    console.error('Error clearing cron events:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearCronEvents();
