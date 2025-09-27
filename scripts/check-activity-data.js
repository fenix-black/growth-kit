const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkActivityData() {
  try {
    // Count activities
    const activityCount = await prisma.activity.count();
    console.log(`Total activities: ${activityCount}`);
    
    // Get sample activities
    const activities = await prisma.activity.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' },
      include: {
        app: true,
        fingerprint: true
      }
    });
    
    console.log('\nSample activities:');
    activities.forEach(activity => {
      console.log(`- ${activity.eventName} for app ${activity.app.name} at ${activity.timestamp}`);
      console.log(`  Context: ${JSON.stringify(activity.context)}`);
      console.log(`  Properties: ${JSON.stringify(activity.properties)}`);
    });
    
    // Check unique apps with activities
    const appsWithActivities = await prisma.activity.groupBy({
      by: ['appId'],
      _count: true
    });
    
    console.log('\nApps with activities:');
    for (const app of appsWithActivities) {
      const appDetails = await prisma.app.findUnique({
        where: { id: app.appId }
      });
      console.log(`- ${appDetails?.name}: ${app._count} activities`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkActivityData();
