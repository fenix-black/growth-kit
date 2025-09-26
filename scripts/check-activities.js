const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkActivities() {
  try {
    // Get the most recent activities
    const activities = await prisma.activity.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        app: { select: { name: true } },
        fingerprint: { select: { fingerprint: true } }
      }
    });

    console.log('\n📊 Recent Activity Tracking Events:\n');
    
    if (activities.length === 0) {
      console.log('No activities found in the database.');
      return;
    }

    activities.forEach((activity, index) => {
      console.log(`${index + 1}. Event: ${activity.eventName}`);
      console.log(`   App: ${activity.app.name}`);
      console.log(`   Fingerprint: ${activity.fingerprint.fingerprint.substring(0, 16)}...`);
      console.log(`   Properties: ${JSON.stringify(activity.properties)}`);
      console.log(`   Timestamp: ${activity.timestamp.toISOString()}`);
      console.log(`   Session: ${activity.sessionId}`);
      console.log('---');
    });

    // Get count by event name
    const eventCounts = await prisma.activity.groupBy({
      by: ['eventName'],
      _count: true,
      orderBy: { _count: { eventName: 'desc' } }
    });

    console.log('\n📈 Event Count Summary:');
    eventCounts.forEach(event => {
      console.log(`   ${event.eventName}: ${event._count.eventName} events`);
    });

    const totalCount = await prisma.activity.count();
    console.log(`\n✅ Total activities tracked: ${totalCount}`);

  } catch (error) {
    console.error('Error checking activities:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkActivities();
